import * as templates from './templates.js';
import * as nodes from "../nodes/nodes.js";
import * as util from "./util.js"
import { tes } from '../nodes/bgcanv.js';
import { testNodeDescr } from '../shaderNodes/shaders.js';

window.tpl = templates
window.nodes=nodes
window.util=util

const n = new nodes.Nodefield(document.getElementById("nf"))
n.addcm.summon(n.view,0,0,n.view.getBoundingClientRect)
n.setXyUnderWindowPos(0,0,100,100,1);
window.n=n;
n.addNode(100,0,nodes.DefaultVertex)
//n.addNode(-150,0,testNodeDescr)
tes()
util.keys.on.a.add(()=>{
  let mpos = n.xyUnderWindowPos()
  console.log("adding at" ,mpos);
  n.addNode(mpos.x,mpos.y,nodes.DefaultVertex)
})
util.keys.on.b.add(()=>{
  let mpos = n.xyUnderWindowPos()
  n.addNode(mpos.x,mpos.y,nodes.DefaultVertex,testNodeDescr)

})
util.keys.on.d.add(()=>{
  n.delNode()
})