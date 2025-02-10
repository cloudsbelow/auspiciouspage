



export class CubicBezier{
  constructor(x0,y0,x1,y1,x2,y2,x3,y3){
    this.points = new Float32Array([x0,x1,x2,x3,y0,y1,y2,y3]);
    this.px = new Float32Array(this.points.buffer,0,4)
    this.py = new Float32Array(this.points.buffer,16,4)
  }
  split(){
    const x = this.px;
    const y = this.py;
    x01=(x[0]+x[1])/2
    x12=(x[1]+x[2])/2
    x23=(x[2]+x[3])/2
    x012=(x01+x02)/2
    x123=(x12+x23)/2
    x0123=(x012+x123)/2
    y01=(y[0]+y[1])/2
    y12=(y[1]+y[2])/2
    y23=(y[2]+y[3])/2
    y012=(y01+y02)/2
    y123=(y12+y23)/2
    y0123=(y012+y123)/2
    return [
      new CubicBezier([x[0],y[0],x01,y01,x012,y012,x0123,y0123]),
      new CubicBezier([x0123,y0123,x123,y123,x23,y23,x[3],y[3]])
    ]
  }
  maybeLineIntersect(x0,y0,x1,y1){
    let num1=0,num2=1,num3=2,num4=3
    const y = this.py
    if(y[num1]>y[num2]){let temp =num1; num1=num2; num2=temp};
    if(y[num3]>y[num4]){let temp =num3; num3=num4; num4=temp};
    if(y[num1]>y[num3]){let temp =num1; num1=num3; num3=temp};
    if(y[num2]>y[num4]){let temp =num2; num2=num4; num4=temp};
    if(y[num2]>y[num3]){let temp =num2; num2=num3; num3=temp};

  }
  static fromCatmullEdge(edge){
    x0=edge.endpoints[0]
    y0=edge.endpoints[1]
    x3=edge.endpoints[2]
    y3=edge.endpoints[3]
    [tx0,ty0,tx1,ty1]=edge.getTangents()
    return new CubicBezier(x0,y0,x0+tx0/3,y0+ty0/3,x3-tx1/3,y3-ty1/3,x3,y3);
  }
}