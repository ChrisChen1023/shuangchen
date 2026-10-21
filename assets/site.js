(() => {
  const controls = document.querySelector('.publication-controls');
  const papers = [...document.querySelectorAll('.publication')];
  const count = document.getElementById('publication-count');
  const empty = document.getElementById('publication-empty');
  if (!controls || !papers.length || !count || !empty) return;

  let view = 'selected';
  let topic = 'all';

  function update() {
    let visible = 0;
    for (const paper of papers) {
      const inView = view === 'all' || paper.dataset.selected === 'true';
      const inTopic = topic === 'all' || paper.dataset.topics.split(' ').includes(topic);
      paper.hidden = !(inView && inTopic);
      if (!paper.hidden) visible++;
    }
    for (const button of controls.querySelectorAll('[data-view]')) button.setAttribute('aria-pressed', String(button.dataset.view === view));
    for (const button of controls.querySelectorAll('[data-topic]')) button.setAttribute('aria-pressed', String(button.dataset.topic === topic));
    count.textContent = `${visible} ${view === 'selected' ? 'selected ' : ''}${visible === 1 ? 'paper' : 'papers'}${topic === 'all' ? '' : ' in this topic'}`;
    empty.hidden = visible !== 0;
  }

  controls.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || !controls.contains(button)) return;
    if (button.dataset.view) view = button.dataset.view;
    if (button.dataset.topic) topic = button.dataset.topic;
    update();
  });

  update();
  controls.hidden = false;
})();
