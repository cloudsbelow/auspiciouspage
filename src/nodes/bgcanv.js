import { b_cc, BAsyncObj } from "../util/util.js";
import * as ver from "../util/verbose.js";

const trianglePipe = /*wgsl*/`
  struct triparams{
    corner:vec2f,
    scale:vec2f,
    transf:mat2x2f,
    color:vec4f
  }
  @group(0) @binding(0) var<uniform> params:triparams;
  const shape = array(
    vec2f(-0.5,0),vec2f(0.5,0),vec2f(0,1)
  );
  const shapelen:u32=3;

  @vertex
  fn vertexMain(
    @builtin(vertex_index) vidx : u32,
    @builtin(instance_index) iidx : u32,
  ) -> @builtin(position) vec4<f32> {
    
    let origin = vec2f(f32(vidx/shapelen)*0.5,f32(iidx*2+(vidx/shapelen)%2));
    let th = (origin+params.transf*shape[vidx%shapelen])*params.scale+params.corner;
    return vec4<f32>(th*vec2f(2,-2.)-vec2f(1,-1), 0.0, 1.0);
  }

  @fragment
  fn fragmentMain(
    @builtin(position) spos:vec4f
  )->@location(0) vec4f{
    return params.color;
  }
`;


const splinePipe = /*wgsl*/`
  //catmull splines
  struct splineDesc{
    e0:vec2f,
    e1:vec2f,
    tang:vec2f,
    c0:u32,
    c1:u32,
  };
  struct splineParams{
    offset:vec2f,
    scale:vec2f,
    lwidth:f32,
    detail:f32,
    basetang:vec2f,
    splines:array<splineDesc>,
  };
  const colorsharp=12;
  @group(0) @binding(0) var<storage,read> params:splineParams;
  //location in xy, derivative in zw
  fn splineLoc(t:f32,spline:splineDesc)->vec4f{
    let tt=t*t;
    let ttt=tt*t;
    let pos=(2*ttt-3*tt+1)*spline.e0+(ttt-2*tt+t)*spline.tang+
            (-2*ttt+3*tt)*spline.e1+(ttt-tt)*spline.tang;
    let deriv=(6*tt-6*t)*spline.e0+(3*tt-4*t+1)*spline.tang+
              (-6*tt+6*t)*spline.e1+(3*tt-2*t)*spline.tang;
    return vec4(pos,deriv);
  }

  struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
  };
  @vertex
  fn vertexMain(
    @builtin(vertex_index) vidx : u32,
    @builtin(instance_index) iidx : u32,
  ) -> VertexOutput{
    let spline=params.splines[iidx];

    let seg:u32 = vidx/6;
    let vert:i32 = 1<<(vidx%6);
    let t=f32(seg+select(u32(0),u32(1),(vert&28)!=0))/params.detail;
    let posinfo=splineLoc(t,spline);
    let norm = normalize(vec2f(-posinfo.w,posinfo.z))*params.lwidth;
    let pos = posinfo.xy+norm*select(1.,-1.,(vert&14)!=0)+params.offset;

    var out:VertexOutput;
    out.position=vec4f(pos*params.scale*vec2f(2,-2)-vec2f(1,-1),0.,1.);
    let fac = atan(colorsharp*(t-0.5))/atan(colorsharp/2)/2+0.5;
    out.color=mix(unpack4x8unorm(spline.c0),unpack4x8unorm(spline.c1),fac);
    return out;
  }

  @fragment
  fn fragmentMain(
    @location(0) color:vec4f
  )->@location(0) vec4f{
    return color;
  }
`;

const pipe = new BAsyncObj()

ver.startWebGPU((device)=>{
  pipe.tbgl = ver.bgl(device, "tri pattern buffers",[{r:"b"}])
  pipe.sbgl = ver.bgl(device, "spline buffers",[{r:"b",t:"r"}])
  pipe.device=device;

  const pref =navigator.gpu.getPreferredCanvasFormat()
  const trirp = ver.rp(device, "triangle pipe",[pipe.tbgl],null,trianglePipe,[pref], null);
  const splrp = ver.rp(device, "spline pipe", [pipe.sbgl], null, splinePipe, [pref], null);

  pipe.fn = (outtex,tbg,sbg,nrow,ncol,nspl)=>{
    ver.enc(device,(enc)=>{
      trirp(enc,null,[6*Math.floor(ncol),Math.floor(nrow)],null,[{
        tex:outtex,
        clearValue:[29/255,31/255,35/255,1],
      }],[tbg])
      if(nspl)splrp(enc, null, [6*NodeEdgeRenderer.options.splinedetail,nspl], null, [{
        tex:outtex,
        loadOp:"load"
      }],[sbg])
    })
  }
  pipe.settle()
})

const SHEADSIZE=4*8;
const SDEFSIZE=4*8;
export class NodeEdgeRenderer{
  static options = {
    spacing:140,
    splinedetail:16,
    maxsplines:1<<15,
    lwidth:3,
  }
  constructor(nodefield){
    this.nf=nodefield
    this.container=this.nf.view;
    this.canvas = document.createElement('canvas')
    this.container.appendChild(this.canvas)

    this.splines = [];
    this.splinebuf = new Uint8Array(SHEADSIZE+SDEFSIZE*NodeEdgeRenderer.options.maxsplines)
    this.splinebuf.set(b_cc(
      new Float32Array([0,0,1,1]),
      new Float32Array([0.004,0,0,NodeEdgeRenderer.options.splinedetail])
    ))

    pipe.when(this.formatCanvas.bind(this))
    pipe.when(({device, tbgl, sbgl, fn})=>{
      const triparams = this.tparams= device.createBuffer({
        label: "triangle pattern parameters",
        size: 4*12,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      device.queue.writeBuffer(triparams, 16, new Float32Array([0.09,0,0,0.09,0.6,0.63,0.65,1]));
      this.tbg = ver.bg(tbgl, "tri pattern buffers", [{buffer:triparams}])
  
      const splineparams = this.sparams= device.createBuffer({
        label: "spline pattern parameters",
        size: this.splinebuf.byteLength,
        usage: GPUBufferUsage.COPY_DST|GPUBufferUsage.STORAGE
      })
      device.queue.writeBuffer(splineparams,0,this.splinebuf)
      this.sbg = ver.bg(sbgl, "spline buffers",[{buffer:splineparams}])
      this.ini=true;
    })
  }
  formatCanvas(){
    const rect = this.container.getBoundingClientRect();
    const canvas=this.canvas
    canvas.width=(this.lw=rect.width)*2;
    canvas.height=(this.lh=rect.height)*2;
    this.canv = ver.linkCanvas(pipe.device, canvas,GPUTextureUsage.RENDER_ATTACHMENT)
  }
  render(){
    if(!this.ini) return false;
    const fac = NodeEdgeRenderer.options.spacing;
    const rect = this.container.getBoundingClientRect();
    if(this.lw!=rect.width || this.lh!=rect.height) this.formatCanvas();
    const hfac = fac*this.nf.scale/rect.width
    const vfac = fac*this.nf.scale/rect.height*2
    pipe.device.queue.writeBuffer(this.tparams,0,new Float32Array([
      this.nf.fieldleft/rect.width%hfac-2*hfac,
      this.nf.fieldtop/rect.height%vfac-2*vfac,
      fac*this.nf.scale/(rect.width),fac*this.nf.scale/(rect.height)
    ]))
    pipe.device.queue.writeBuffer(this.sparams,0,new Float32Array([
      this.nf.fieldleft/this.nf.scale,this.nf.fieldtop/this.nf.scale,
      this.nf.scale/rect.width,this.nf.scale/rect.height,
      NodeEdgeRenderer.options.lwidth/this.nf.scale*Math.sqrt(this.nf.scale),
      NodeEdgeRenderer.options.splinedetail
    ]))
    pipe.fn(this.canv[0].getCurrentTexture(),this.tbg,this.sbg,1/vfac+4,1/hfac+4,this.splines.length);
    return true;
  }
  uplspline(slot){
    if(slot && this.ini){
      let o = SHEADSIZE+slot*SDEFSIZE
      console.log(o)
      pipe.device.queue.writeBuffer(this.sparams, o,this.splinebuf, o,SDEFSIZE)
    } else if(this.ini){
      pipe.device.queue.writeBuffer(this.sparams, 0, this.splinebuf)
    }
    this.nrend=true;
  }
  assignSlot(slot,edge,quiet=false){
    edge.slotidx=slot;
    edge.f=this;
    this.splines[slot]=edge;
    const nep = new Float32Array(this.splinebuf.buffer,SHEADSIZE+slot*SDEFSIZE,4);
    nep.set(edge.endpoints)
    edge.endpoints=nep;
    const ntang = new Float32Array(this.splinebuf.buffer,SHEADSIZE+slot*SDEFSIZE+4*4,2)
    ntang.set(edge.tang)
    edge.tang=ntang;
    const col = new Uint8Array(this.splinebuf.buffer,SHEADSIZE+slot*SDEFSIZE+4*6,8);
    col.set(edge.colors);
    edge.colors=col;
    if(!quiet) this.uplspline(slot);
  }
  removeEdge(edge){
    if(edge.start){
      edge.start.edges.delete(edge);
    }
    if(edge.end)edge.end.edge=null;
    const slot = edge.slotidx;
    edge.slotidx=null;
    const last = this.splines[this.splines.length-1]
    --this.splines.length //hate that this has to be on a sepperate line
    if(edge == last) return;
    this.assignSlot(slot,last);
  }
  addEdge(edge,quiet=false){
    this.assignSlot(this.splines.push(edge)-1,edge,quiet);
  }
  mkEdge(quiet=false){
    let edge = new NodeEdge();
    this.addEdge(edge)
    return edge
  }
}
export class NodeEdge{
  constructor(r){
    this.endpoints = new Float32Array(4);
    this.tang = new Float32Array(2)
    this.colors = new Uint8Array(8);
  }
  change(){
    const dx = this.endpoints[0]-this.endpoints[2];
    const dy = this.endpoints[1]-this.endpoints[3];
    const d = Math.sqrt(dx*dx+dy*dy);
    this.tang[0]=Math.max(1.5*(-dx),Math.min(d*2,200),d);
    this.f.uplspline(this.slot)
  }
}
export const tes = ()=>{}
