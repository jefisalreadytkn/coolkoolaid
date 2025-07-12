const blocks = document.querySelectorAll('.block');
const programArea = document.getElementById('program-area');
const runBtn = document.getElementById('run-button');
const sprite = document.getElementById('sprite');

let pos = { x: 50, y: 50 }, angle = 0;
let run = false;

blocks.forEach(b => b.addEventListener('dragstart', e => {
  const p = b.querySelector('.param');
  e.dataTransfer.setData('type', b.dataset.type);
  e.dataTransfer.setData('value', p ? p.value : '');
}));

programArea.addEventListener('dragover', e => e.preventDefault());
programArea.addEventListener('drop', e => {
  e.preventDefault();
  addBlock(programArea, e.dataTransfer.getData('type'), e.dataTransfer.getData('value'));
});

function addBlock(parent, type, value) {
  const el = document.createElement('div');
  el.className = 'program-block';
  el.dataset.type = type;
  el.dataset.value = value;
  el.innerHTML = `${describe(type, value)} <span class="remove-btn">✕</span>`;
  parent.appendChild(el);
  el.querySelector('.remove-btn').onclick = () => el.remove();

  if (['loop', 'whenclicked', 'js'].includes(type)) {
    const cont = document.createElement('div');
    cont.className = 'container';
    el.appendChild(cont);
    cont.addEventListener('dragover', ev => ev.preventDefault());
    cont.addEventListener('drop', ev => {
      ev.preventDefault();
      addBlock(cont, ev.dataTransfer.getData('type'), ev.dataTransfer.getData('value'));
    });
  }
}

runBtn.onclick = () => startRun();

document.getElementById('start-flag').onclick = () => startRun();
document.getElementById('stop-button').onclick = () => { run = false; };

function startRun() {
  run = true;
  resetSprite();
  const children = Array.from(programArea.children).filter(b => b.dataset.type !== 'whenclicked');
  runSequence(children);
}

async function runSequence(list) {
  for (let el of list) {
    if (!run) break;
    const type = el.dataset.type, value = el.dataset.value;
    if (type === 'whenclicked') {
      const clicks = Array.from(el.querySelector('.container').children);
      sprite.onclick = () => runSequence(clicks);
    } else {
      await execute(type, value, el);
    }
  }
}

function describe(t, v) {
  switch (t) {
    case 'moveX': return `Move X by ${v}`;
    case 'moveY': return `Move Y by ${v}`;
    case 'turn': return `Turn ${v}°`;
    case 'say': return `Say "${v}"`;
    case 'color': return 'Change Color';
    case 'beep': return `Beep ${v} Hz`;
    case 'loop': return `Repeat ${v} times { }`;
    case 'whenclicked': return 'When sprite clicked { }';
    case 'js': return 'JavaScript { }';
  }
}

function execute(type, value, el) {
  return new Promise(async resolve => {
    if (!run) return resolve();
    switch (type) {
      case 'moveX':
        pos.x += +value;
        sprite.style.left = `${pos.x}%`;
        break;
      case 'moveY':
        pos.y += +value;
        sprite.style.top = `${pos.y}%`;
        break;
      case 'turn':
        angle += +value;
        sprite.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
        break;
      case 'say':
        alert(value);
        break;
      case 'color':
        sprite.style.filter = `hue-rotate(${Math.random()*360}deg)`;
        break;
      case 'beep':
        playBeep(value);
        break;
      case 'loop':
        const times = +value, kids = Array.from(el.querySelector('.container').children);
        for (let i = 0; i < times && run; i++) await runSequence(kids);
        break;
      case 'js':
        const code = Array.from(el.querySelector('.container').childNodes)
                          .map(n => n.innerText || '')
                          .join('\n');
        if (run) try { eval(code); } catch (e) { console.error(e); }
        break;
    }
    setTimeout(resolve, 33);
  });
}

function resetSprite() {
  pos = { x: 50, y: 50 };
  angle = 0;
  sprite.style.left = '50%';
  sprite.style.top = '50%';
  sprite.style.transform = 'translate(-50%, -50%) rotate(0deg)';
}

function playBeep(freq) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  osc.frequency.value = +freq;
  osc.connect(ctx.destination);
  osc.start();
  setTimeout(() => osc.stop(), 300);
}

// Sprite & BG choosers
document.getElementById('sprite-chooser').onchange = e => {
  sprite.style.backgroundImage = `url('${e.target.value}')`;
};
document.getElementById('bg-chooser').onchange = e => {
  const val = e.target.value;
  document.getElementById('stage').style.background = val.startsWith('#') ? val : `url('${val}') center/cover`;
};

// Save / Load
document.getElementById('save-btn').onclick = () => {
  const data = Array.from(programArea.children).map(el => ({
    type: el.dataset.type,
    value: el.dataset.value,
    children: el.querySelector('.container')
      ? Array.from(el.querySelector('.container').children).map(c => ({
          type: c.dataset.type,
          value: c.dataset.value
        }))
      : null
  }));
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'script.json';
  a.click();
};

document.getElementById('load-btn').onclick = () => document.getElementById('file-input').click();
document.getElementById('file-input').onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      programArea.innerHTML = '<h2>Your Program</h2>';
      data.forEach(block => {
        addBlock(programArea, block.type, block.value);
        if (block.children && block.children.length > 0) {
          const container = programArea.lastChild.querySelector('.container');
          block.children.forEach(c => addBlock(container, c.type, c.value));
        }
      });
    } catch {
      alert('Invalid or corrupted file');
    }
  };
  reader.readAsText(file);
};
