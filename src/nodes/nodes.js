import { CustomContextmenu } from "../util/contextmenu.js";
import { _div, _subidx, deferedstring, _breffn, htmltemplate } from "../util/templates.js";
import { b_cc, clamp, Color, doWinDrag, mouseClientPos } from "../util/util.js";
import { NodeEdgeRenderer } from "./bgcanv.js";

/**
 * @typedef {Object} Nodefield
 * @property {HTMLDivElement} view
 * @property {HTMLDivElement} field
 * @property {number} scale
 * @property {number} fieldleft
 * @property {number} fieldtop
 * @property {boolean} dorender
 * @property {NodeEdgeRenderer} bg 
 */
export class Nodefield{
  static options = {
    scrollspeed:-0.03,
    minzoom:0.05,
    maxzoom:4,
  }
  static descriptor = new _div({
    w:"100%",h:"90%",bg:"#1d1f23",ref:"view",class:"nf-window",
    md:new _breffn(Nodefield.prototype.dragField),
    wheel:new _breffn(Nodefield.prototype.zoomField),
    c:new _div({
      ref:"field",class:"nf-field",
    })
  })

  constructor(container,edgetypes){
    container.appendChild(Nodefield.descriptor.mk(null,this));
    this.edgetypes=edgetypes
    this.vertices = new Map()
    this.logscale=0
    this.scale=1
    this.fieldleft=0
    this.fieldtop=0
    this.addcm = new CustomContextmenu([{o:"hat"},{horizontalBar:true},{o:"bat"}])
    this.bg = new NodeEdgeRenderer(this);
    this.dorender=true;
    this.rso = new ResizeObserver(()=>{this.dorender=true})
    this.rso.observe(container);
    this.active=true;
    this.uuids=0
    this.render()
  }
  render(){
    if(this.dorender||this.bg.nrend)this.dorender=!this.bg.render();
    requestAnimationFrame(this.render.bind(this));
  }
  addNode(x,y,constr, dat){
    const v = new constr(this,x,y, dat)
    this.vertices.set(++this.uuids,v)
    return v
  }
  delNode(v){
    if(v==null)return this.delNode(this.sv)
    if(this.sv == v)this.sv=null
    v.remove()
  }
  setRawOffset(x,y){
    this.field.style.left=(this.fieldleft=x)+"px"
    this.field.style.top=(this.fieldtop=y)+"px"
    this.dorender=true;
  }
  dragField(ev){
    const offset = [this.field.offsetLeft-ev.clientX,this.field.offsetTop-ev.clientY];
    this.setSelected(null)
    doWinDrag((ev)=>{
      this.setRawOffset(ev.clientX+offset[0],ev.clientY+offset[1])
    })
  }
  xyUnderWindowPos(x,y){
    if(x===undefined||y===undefined){
      const rect = this.view.getBoundingClientRect()
      x??=mouseClientPos.x-rect.x;
      y??=mouseClientPos.y-rect.y;
    }
    return {
      x:(x-this.fieldleft)/this.scale,
      y:(y-this.fieldtop)/this.scale
    }
  }
  setXyUnderWindowPos(nx,ny,cx,cy,scale=undefined){
    if(scale){
      this.logscale=clamp(Math.log(scale),
        Math.log(Nodefield.options.minzoom),
        Math.log(Nodefield.options.maxzoom))
      this.view.style.setProperty("--fieldscale",this.scale=Math.exp(this.logscale))
      this.dorender=true;
    }
    this.setRawOffset(-nx*this.scale+cx,-ny*this.scale+cy)
  }
  zoomField(ev){
    ev.preventDefault();
    const rect = this.view.getBoundingClientRect()
    const cpos = [mouseClientPos.x-rect.x,mouseClientPos.y-rect.y]
    const center=this.xyUnderWindowPos(...cpos)
    this.logscale+=Nodefield.options.scrollspeed*ev.deltaY
    this.logscale=clamp(this.logscale,
      Math.log(Nodefield.options.minzoom),
      Math.log(Nodefield.options.maxzoom))
    this.view.style.setProperty("--fieldscale",this.scale=Math.exp(this.logscale))
    this.dorender=true;
    this.setXyUnderWindowPos(center.x,center.y,...cpos)
  }
  setSelected(v=null){
    this.sv?.elem.classList.remove("nfv-contselected")
    this.sv=v
    if(this.sv){
      this.sv.elem.classList.add("nfv-contselected")
    }
  }
}



export class NodeEdgetype{
  static defaultPlug = new _div({
    class:"nfi-b",bg:new _subidx("plugcolor")
  })
  constructor(color,type,plug){
    this.color = color
    this.hex = color.tosolidhex()
    this.type = type
    this.plug = plug??NodeEdgetype.defaultPlug
    this.okfrom = []
  }
  setValidCasts(...valid){
    this.okfrom = valid
  }
}
const defaultEdge = new NodeEdgetype(new Color(255,255,255,255),"default")
const defaultEdge2 = new NodeEdgetype(new Color(255,0,255,255),"default2")



function edgeDrag(ds,field){
  const edge=ds.edge;
  doWinDrag((ev)=>{
    if(ds.hovering) return;
    const mpos = field.xyUnderWindowPos()
    edge.endpoints[2]=mpos.x; edge.endpoints[3]=mpos.y
    edge.change()
  },(ev)=>{
    field.edgeDrag=null
    if(ds.hovering){
      if(ds.hovering.edge){
        field.bg.removeEdge(ds.hovering.edge)
      }
      ds.hovering.edge=edge;
      edge.end = ds.hovering;
      ds.hovering.v.onInputChange(ds.hovering)
    } else {
      field.bg.removeEdge(edge);
    }
  })
}
export class VertexInput{
  constructor(vertex, type, idx, edge=null){
    this.v=vertex;
    this.type=type
    this.edge=edge;
    this.idx = idx;
  }
  hover(ev){
    //this.pcont.style.backgroundColor="#fff";
    const ds=this.v.field.edgeDrag;
    if(ds){
      ds.hovering = this;
      this.pcont.onmouseleave = this.lhover.bind(this);
      ds.edge.endpoints[2]=this.v.x;
      ds.edge.colors.set(b_cc(this.type.edgetype.color),4)
      const r1 = this.v.elem.getBoundingClientRect();
      const r2 = this.pcont.getBoundingClientRect();
      ds.edge.endpoints[3]=this.v.y+(r2.top-r1.top)/this.v.field.scale+15;
      ds.edge.change()
    }
  }
  lhover(ev){
    this.pcont.onmouseleave=null;
    if(this.v.field.edgeDrag?.hovering == this){
      this.v.field.edgeDrag.hovering = null;
      const b = this.v.field.edgeDrag.edge.colors;
      const c = new Uint32Array(b.buffer,b.byteOffset,b.byteLength)
      c[1]=c[0]
    }
  }
  click(ev){
    ev.stopPropagation()
    if(this.edge){
      const edge= this.edge
      const ds= this.v.field.edgeDrag  = {
        edge:edge,
        hovering:this
      }
      edge.end = null;
      this.edge = null;
      edgeDrag(ds, this.v.field)
      this.pcont.onmouseleave = this.lhover.bind(this);
    }
  }
}
export class VertexInputtype{
  pcontdescr = new _div({
    class:"nfv-inpplug", ref:"pcont",c:new _subidx("plug"),
    onmouseover: new _breffn(VertexInput.prototype.hover),
    md: new _breffn(VertexInput.prototype.click)
  })
  bodydescr=new _div({
    class:"nfv-inpbody",c:new _subidx("body"),ref:"body",
  })
  inputDescr = new _div({
    class:"nfv-inpcont",ref:"elem",c:new _subidx("items")
  })
  ctype = VertexInput
  constructor(edgetype, template, plug){
    this.edgetype=edgetype
    this.template=template
    this.plug = plug
  }
  mk(subs, refs){
    return this.inputDescr.mk({
      items:this.edgetype?[this.pcontdescr,this.bodydescr]:this.bodydescr,
      plug:this.plug??NodeEdgetype.defaultPlug,
      plugcolor:this.edgetype?.color.tosolidhex(),
      body:this.template,
      d:subs
    },refs)
  }
}


export class VertexOutput{
  constructor(vertex,type){
    this.edges=new Set()
    this.v=vertex
    this.type=type
    this.plug = type.plug.mk(this,this)
  }
  dragOut(ev){
    ev.stopPropagation()
    const v=this.v
    const edge=v.field.bg.mkEdge(true);
    const mpos = v.field.xyUnderWindowPos()
    const e1x=v.x+v.outxoff;
    const e1y=v.y+this.elem.offsetTop+13
    edge.endpoints.set([e1x,e1y,mpos.x,mpos.y])
    edge.colors.set(b_cc(this.type.color,this.type.color))
    edge.change()
    edge.start = this;
    this.edges.add(edge);
    const ds = v.field.edgeDrag = {
      edge:edge,
    }
    edgeDrag(ds,v.field);
  }
}


/**
 * @typedef {Object} VertexDescriptor
 * @property {VertexInputtype[]} inputs
 * @property {NodeEdgetype[]} outputs
 * @property {string} name
 */
export class Vertex{
  static baseDescr = new _div({
    ref:"elem", class:"nfv-cont",top:new _subidx("y"),left:new _subidx("x"),
    md:new _breffn(Vertex.prototype.clicked),
    c:[new _div({
      ref:"header",bg:"#ff0000",class:"nfv-head",
      md:new _breffn(Vertex.prototype.dragNode),
      c:[new _div({
        textContent:new _subidx("name")
      })]
    }),new _div({
      ref:"body", /*c:new _subidx("inputs")*/
    }),new _div({
      ref:"outelem", /*c:new _subidx("outputs")*/class:"nfv-out",
    })]
  })
  static outputDescr=new _div({
    class:"nfv-outplug",c:new _subidx("plug"),ref:"elem",
    md:new _breffn(VertexOutput.prototype.dragOut)
  })
  /**
   * @param {Nodefield} field 
   * @param {number} x 
   * @param {number} y 
   * @param {VertexDescriptor} descriptor 
   */
  constructor(field,x,y,descriptor){
    this.field=field;
    this.x=x??0
    this.y=y??0
    this.outputs = []
    this.inputs = []
    this.field.field.appendChild(Vertex.baseDescr.mk({
      name:descriptor.name,
      x:this.x,y:this.y,
    },this))
    this.setFormat(descriptor.inputs, descriptor.outputs)
    requestAnimationFrame(()=>{
      this.outxoff = this.outelem.offsetLeft+15;
    })
  }
  onInputChange(input,){
    console.log(input)
  }

  fixEdges(){
    const e1x=this.x+this.outxoff;
    const r1 = this.elem.getBoundingClientRect();
    this.outputs.forEach(o=>{
      o.edges.forEach(e=>{
        const e1y=this.y+o.elem.offsetTop+13
        e.endpoints.set([e1x,e1y])
        e.change()
      })
    })
    this.inputs.forEach(i=>{
      if(!i.edge) return;
      i.edge.endpoints[2]=this.x;
      const r2 = i.pcont.getBoundingClientRect();
      i.edge.endpoints[3]=this.y+(r2.top-r1.top)/this.field.scale+15;
      i.edge.change()
    })
  }
  dragNode(ev){
    ev.stopPropagation()
    this.field.setSelected(this)
    const scale = this.field.scale;
    const offset = [ev.clientX/scale-this.x,ev.clientY/scale-this.y]
    doWinDrag((ev)=>{
      this.elem.style.left = (this.x=ev.clientX/scale-offset[0])+"px"
      this.elem.style.top = (this.y=ev.clientY/scale-offset[1])+"px"
      
      this.fixEdges()
    })
  }
  setFormat(i,o){
    const c=this.field.bg
    if(i){
      this.inputs.forEach(inp=>{
        if(i.indexOf(inp)==-1 && inp.edge){
          c.removeEdge(inp.edge)
          inp.edge=null
        }
      })
      this.inputs = []
      this.body.replaceChildren(...i.map((t,idx)=>{
        if(t instanceof VertexInput){
          this.inputs[idx]=t
          return t.elem;
        }
        let obj = new t.ctype(this, t)
        this.inputs[idx]=obj
        return t.mk(this, obj)
      }))
    }
    if(o){
      this.outputs.forEach(out=>{
        if(o.indexOf(out)==-1){
          out.edges.forEach(e=>{
            c.removeEdge(e)
          })
          out.edges = new Set()
        }
      })
      this.outputs=[]
      this.outelem.replaceChildren(...o.map((out,idx)=>{
        if(out instanceof VertexOutput){
          this.outputs[i]=out;
          return out.elem
        }
        const obj = new VertexOutput(this, out)
        this.outputs[idx]=obj
        return Vertex.outputDescr.mk({
          plug:NodeEdgetype.defaultPlug,
          plugcolor:out.color.tosolidhex()
        },obj) 
      }))
    }
    this.fixEdges()
  }
  clicked(ev){
    ev.stopPropagation()
    this.field.setSelected(this)
  }
  remove(){
    const c=this.field.bg
    this.inputs.forEach(i=>{
      if(i.edge)c.removeEdge(i.edge);
    });
    this.outputs.forEach(o=>{
      o.edges.forEach(e=>{
        c.removeEdge(e)
      })
    })
    this.field.vertices.delete(this)
    this.elem.remove();
  }
}

export class DefaultVertex extends Vertex{
  static descriptor = {
    inputs:[
      new VertexInputtype(defaultEdge, new _div({textContent:"input0"})),
      new VertexInputtype(defaultEdge2, new _div({textContent:"input1"})),
      new VertexInputtype(defaultEdge, new _div({textContent:"input2"})),
    ],
    outputs:[
      defaultEdge,
      defaultEdge2
    ],
    name:"default"
  }
  constructor(field,x,y,dat){
    super(field,x,y,dat??DefaultVertex.descriptor)
  }
}