class Snake {
  constructor() {
    this.segments = [{x: 10, y: 10}];
    this.direction = {x: 20, y: 0};
    console.log('Snake constructor called');
  }

  reset() {
    this.segments = [{x: 10, y: 10}];
    this.direction = {x: 20, y: 0};
    console.log('Snake reset called');
  }

  setDirection(newDirection) {
    this.direction = newDirection;
    console.log('Snake direction set to:', newDirection);
  }

  move() {
    const head = {...this.segments[0]};
    head.x += this.direction.x;
    head.y += this.direction.y;
    this.segments.unshift(head);
    this.segments.pop();
    console.log('Snake moved to:', head);
  }
}

export default Snake;
