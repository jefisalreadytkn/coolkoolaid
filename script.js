// Sprite/background chooser
document.getElementById('sprite-chooser').onchange = e => {
  sprite.style.backgroundImage = `url('${e.target.value}')`;
};
document.getElementById('bg-chooser').onchange = e => {
  const val = e.target.value;
  const stage = document.getElementById('stage');
  stage.style.background = val.startsWith('#') ? val : `url('${val}') center/cover`;
};

// Save / Load
const saveBtn = document.getElementById('save-btn');
const loadBtn = document.getElementById('load-btn');
const fileInput = document.getElementById('file-input');

saveBtn.onclick = () => {
  const data = Array.from(programArea.children).map(el => ({
    type: el.dataset.type,
    value: el.dataset.value,
    children: el.querySelector('.container')
      ? Array.from(el.querySelector('.container').children).map(c => ({
          type: c.dataset.type,
          value: c.dataset.value,
        }))
      : null
  }));
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'script.json';
  a.click();
};

loadBtn.onclick = () => fileInput.click();
fileInput.onchange = e => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      programArea.innerHTML = '<h2>Your Program</h2>';
      data.forEach(block => {
        addBlock(programArea, block.type, block.value);
        if (block.children)
          block.children.forEach(c => addBlock(programArea.lastChild.querySelector('.container'), c.type, c.value));
      });
    } catch (err) {
      alert('Invalid file');
    }
  };
  reader.readAsText(file);
};
