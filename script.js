const blocks = document.querySelectorAll('.block');
const programArea = document.getElementById('program-area');
const runBtn = document.getElementById('run-button');
const sprite = document.getElementById('sprite');

let angle = 0, pos = { x: 50, y: 50 };
let currentEventBlocks = [];

blocks.forEach(b => {
  b.addEventListener('dragstart', e => {
    e.dataTransfer.setData('type', b.dataset.type);
    e.dataTransfer.setData('value', b.dataset.value);
  });
});

programArea.addEventListener('dragover', e => e.preventDefault());
programArea.addEventListener('drop', e => {
  e.preventDefault();
  const type = e.dataTransfer.getData('type');
  const value = e.dataTransfer.getData('value');
  addBlock(programArea, type, value);
});

function addBlock(parent, type, value) {
  const el = document.createElement('div');
  el.className = 'program-block';
  el.dataset.type = type;
  el.dataset.value = value;
  el.innerHTML = `${describe(type, value)} <span class="remove-btn">✕</span>`;
  parent.appendChild(el);

  el.querySelector('.remove-btn').onclick = () => el.remove();

  if (type === 'loop' || type === 'whenclicked') {
    const container = document.createElement('div');
    container.className = 'container';
    el.appendChild(container);
    container.addEventListener('dragover', e => e.preventDefault());
    container.addEventListener('drop', e => {
      e.preventDefault();
      const t = e.dataTransfer.getData('type');
      const v = e.dataTransfer.getData('value');
      addBlock(container, t, v);
    });
  }
}

runBtn.onclick = async () => {
  runBtn.disabled = true;
  for (let el of Array.from(programArea.children)) {
    if (el.dataset.type === 'whenclicked') {
      currentEventBlocks = Array.from(el.querySelector('.container').children);
      el.onclick = () => runSequence(currentEventBlocks);
    }
  }
  await runSequence(Array.from(programArea.children));
  runBtn.disabled = false;
};

async function runSequence(blocks) {
  for (let el of blocks) {
    const { type, value } = el.dataset;
    if (type === 'whenclicked') continue;
    await execute(type, value, el);
  }
}

function describe(type, value) {
  switch (type) {
    case 'move': return `Move ${value} steps`;
    case 'turn': return `Turn ${value}°`;
    case 'say': return `Say "${value}"`;
    case 'color': return 'Change Color';
    case 'beep': return 'Beep Sound';
    case 'loop': return `Repeat ${value} times { }`;
    case 'whenclicked': return 'When sprite clicked { }';
  }
}

function execute(type, value, el) {
  return new Promise(async resolve => {
    switch (type) {
      case 'move':
        pos.x += Number(value); sprite.style.left = pos.x + '%'; break;
      case 'turn':
        angle += Number(value);
        sprite.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
        break;
      case 'say':
        alert(value); break;
      case 'color':
        sprite.style.filter = `hue-rotate(${Math.random() * 360}deg)`; break;
      case 'beep':
        playBeep(value); break;
      case 'loop':
        const times = Number(value);
        const children = el.querySelector('.container').children;
        for (let i = 0; i < times; i++) await runSequence(Array.from(children));
        break;
    }
    setTimeout(resolve, 300);
  });
}

function playBeep(freq) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  osc.frequency.value = Number(freq);
  osc.connect(ctx.destination);
  osc.start();
  setTimeout(() => osc.stop(), 300);
}
