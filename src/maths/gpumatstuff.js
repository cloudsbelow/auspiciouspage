const axpb_simple_wgsl = /*wgsl*/`
struct axpbdescr = {
  stride:f32,
  m:f32,
  n:f32,
  flags:u32,
}
@group(0) @binding(0) var<storage,read> A:array<f32>;
@group(0) @binding(1) var<storage, read> B:array<f32>;
@group(0) @binding(2) var<uniform> format:axpbdescr;
@group(1) @binding(0) var<storage, read> x:array<f32>;
@group(2) @binding(0) var<storage, read_write> y:array<f32>;

@compute
@workgroup_size(32,1,1)
fn main(
  @builtin(global_invocation_id) loc:vec3u,
){
  var acc=0;
  if(loc.y>=format.m) return;
  if(flags & 0x1) acc+=y[loc.x];
  if(flags & 0x2) acc+=B[loc.x];
  if(!(flags & 0x4)){
    for(var i=0; i<format.n; i+=1){
      acc+=A[loc.x*stride+i]*x[i];
    }
  } else {
    for(var i=0; i<format.n; i++){
      acc+=A[loc.x+stride*i]*x[i];
    }
  }
  y[loc.x]=acc;
}
`