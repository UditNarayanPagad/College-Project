document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.container');
  
    container.addEventListener('mousemove', (e) => {
      createDot(e.pageX, e.pageY);
    });
  
    function createDot(x, y) {
      const dot = document.createElement('div');
      dot.classList.add('dot');
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;
      container.appendChild(dot);
  
      setTimeout(() => {
        dot.style.transform = 'scale(0.01)';
        setTimeout(() => {
          container.removeChild(dot);
        }, 400);
      }, 100);
    }
  });
  