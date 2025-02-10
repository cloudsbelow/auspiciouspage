import { NodeEdgetype } from "../nodes/nodes.js";
import { Color } from "../util/util.js";



const bool = new NodeEdgetype(new Color(255,0,0,255),"bool")
const float = new NodeEdgetype(new Color(215,200,255,255),"float")
const float2 = new NodeEdgetype(new Color(155,125,220,255),"float2")
const float3 = new NodeEdgetype(new Color(100,75,170,255),"float3")
const float4 = new NodeEdgetype(new Color(75,55,135,255),"float4")
const sint = new NodeEdgetype(new Color(255,255,170,255),"int")
const sint2 = new NodeEdgetype(new Color(180,180,95,255),"int2")
const sint3 = new NodeEdgetype(new Color(140,140,60,255),"int3")
const sint4 = new NodeEdgetype(new Color(100,100,40,255),"int4")
const uint = new NodeEdgetype(new Color(255,170,170,255),"uint")
const uint2 = new NodeEdgetype(new Color(180,95,95,255),"uint2")
const uint3 = new NodeEdgetype(new Color(140,60,60,255),"uint3")
const uint4 = new NodeEdgetype(new Color(100,40,40,255),"uint4")
const color = new NodeEdgetype(new Color(50,255,50,255),"color")

bool.setValidCasts(sint,uint)
float.setValidCasts(sint, uint)
float2.setValidCasts(float, sint, uint, sint2, uint2)
float3.setValidCasts(float, sint, uint, sint3, uint3, color)
float4.setValidCasts(float, sint, uint, sint4, uint4, color)
sint.setValidCasts(float, uint, bool)
sint2.setValidCasts(float, sint, uint, bool, float2, uint2)
sint3.setValidCasts(float, sint, uint, bool, float3, uint3)
sint4.setValidCasts(float, sint, uint, bool, float4, uint4)
uint.setValidCasts(float, uint, bool)
uint2.setValidCasts(float, sint, uint, bool, float2, uint2)
uint3.setValidCasts(float, sint, uint, bool, float3, uint3)
uint4.setValidCasts(float, sint, uint, bool, float4, uint4)
color.setValidCasts(float, float3, float4)

export const testNodeDescr = {
  inputs:[],
  outputs:[
    bool, float, float2, float3, float4, sint, sint2, sint3, sint4, uint, uint2, uint3, uint4, color
  ],
  name: "node display debg"
}

