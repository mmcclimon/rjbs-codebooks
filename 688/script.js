const TextSpinner = class {
  constructor (text) {
    this.pick = ("0123456789"
              + "abcdefghijklmnopqrstuvwxyz"
              + "ABCDEFGHIJKLMNOPQRSTUVWXYZ").split('');

    this.target  = text;
    this.chars   = text.split('');
    this.hidden  = new Set( this.chars.keys() );
  }

  nextStringState () {
    if (this.hidden.size == 0) return { random: "", found: this.target };

    const randInt   = i => Math.floor( Math.random() * i );
    const getRandom = s => [...s.values()][ randInt(s.size) ];

    if (Math.random() > 0.98) this.hidden.delete( getRandom(this.hidden) );

    let state = {};
    state.random = this.chars.map(
      (c, i) => this.hidden.has(i)
                ? this.pick[ randInt(this.pick.length) ]
                : ' '
    ).join('');

    state.found  = this.chars.map(
      (c, i) => this.hidden.has(i) ? ' ' : c
    ).join('');

    return state;
  }
};

const SixEightyEight = class {
  constructor () {
    this.width  = 10;
    this.height = 10;
    this.turn   = 1;

    this.player = { x: 2, y: 5 };

    this.mobs   = [];
    this.addRandomMob();

    document.addEventListener("keyup", event => {
      const code = event.code;
      const player = this.player;

      if (code == 'KeyH') { this.takeTurn({ move: { x: -1, y:  0 } }); }
      if (code == 'KeyJ') { this.takeTurn({ move: { x:  0, y: +1 } }); }
      if (code == 'KeyK') { this.takeTurn({ move: { x:  0, y: -1 } }); }
      if (code == 'KeyL') { this.takeTurn({ move: { x: +1, y:  0 } }); }
    });
  }

  addRandomMob() {
    const newMob = {
      x: Math.floor( Math.random() * 10 ),
      y: Math.floor( Math.random() * 10 ),
      type: (Math.random() > 0.5 ? 'even' : 'odd'),
    };

    this.mobs.push(newMob);
  }

  moveMob (mob, move) {
    const newX = mob.x + move.x;
    const newY = mob.y + move.y;

    // FIXME the "-1" here is bogus, means underlying bug
    mob.x = Math.min(this.width  -1,  Math.max(0, newX));
    mob.y = Math.min(this.height -1,  Math.max(0, newY));
  }

  takeTurn(action) {
    if (action.move) {
      this.moveMob(this.player, action.move);
    }

    this.mobs.forEach(mob => {
      if (mob.x == this.player.x && mob.y == this.player.y) {
        console.log("It dead.");
        mob.isDead = true;
      }

      if (mob.isDead) return;

      if (mob.type == 'even' && this.turn % 2 == 0) return;
      if (mob.type == 'odd'  && this.turn % 2 == 1) return;

      const dir  = Math.floor( 4 * Math.random() );
      const move = dir == 0 ? { x: -1, y:  0 }
                 : dir == 1 ? { x:  0, y: +1 }
                 : dir == 2 ? { x:  0, y: -1 }
                 : dir == 3 ? { x: +1, y:  0 }
                 :            undefined; // unreachable

      this.moveMob(mob, move);
    });

    this.turn++;

    if (this.turn % 37 == 0) {
      this.addRandomMob();
    }
  }
};

const Viewer = class {
  constructor (game, canvas) {
    // Consider barfing if canvas not square.
    this.game   = game;
    this.canvas = canvas;

    this.tick   = 0;

    this.spinner = new TextSpinner("Setec Astronomy");

    window.requestAnimationFrame(this.draw.bind(this));
  }

  drawGridCircle (gridX, gridY) {
    // we take 10px off the canvas on both sides and divide the rest of the
    // canvas up into equal rectangles
    const cellWidth   = (this.canvas.width  - 20) / this.game.width;
    const cellHeight  = (this.canvas.height - 20) / this.game.height;

    var ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(
      Math.floor(10 + (1+gridX) * cellWidth  - cellWidth  / 2),
      Math.floor(10 + (1+gridY) * cellHeight - cellHeight / 2),
      20,
      0,
      2 * Math.PI
    );
    ctx.fill();
  }

  draw() {
    this.tick++;

    if (this.canvas.getContext) {
      var ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // The Wonky Blue Line
      ctx.beginPath();
      ctx.strokeStyle = 'blue';
      ctx.moveTo(0, 100);

      const tock = this.tick % 401;
      const dy   = (tock > 200 ? 400 - tock : tock) - 100;
      const dx   = dy / 2;

      ctx.bezierCurveTo(200 + dx, 100 - dy, 300 + dx, 100 + dy, 500, 100);
      ctx.stroke();

      // The Scrambler
      let stringState = this.spinner.nextStringState();
      ctx.font = '48px monospace';

      ctx.fillStyle = 'red';
      ctx.fillText(stringState.random, 35, 50);

      ctx.fillStyle = 'green';
      ctx.fillText(stringState.found, 35, 50);

      // The Adventurer
      ctx.strokeStyle = 'orange';
      ctx.fillStyle   = 'purple';
      this.drawGridCircle(this.game.player.x, this.game.player.y);
      // ctx.beginPath();
      // ctx.arc(this.game.player.x, this.game.player.y, 20, 0, 2 * Math.PI);
      // ctx.fill();

      // Mobs
      this.game.mobs.forEach(mob => {
        if (mob.isDead) return;

        ctx.strokeStyle = 'orange';
        ctx.fillStyle   = mob.type == 'even' ? 'pink' : 'orange';

        this.drawGridCircle(mob.x, mob.y);
      });

      // Turn Count
      ctx.font = '24px monospace';
      ctx.fillStyle = 'blue';
      ctx.fillText(`turn ${this.game.turn}`, 375, 490);
    }

    window.requestAnimationFrame(this.draw.bind(this));
  }
};

const game   = new SixEightyEight();
const viewer = new Viewer(game, document.getElementById('canvas'));
