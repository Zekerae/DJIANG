
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Select all the tab buttons and tab panels
    const tabButtons = document.querySelectorAll('.ei-tab-btn');
    const tabPanels = document.querySelectorAll('.ei-tab-panel');

    // 2. Add a click event listener to each button
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        
        // 3. Remove the 'active' class and reset ARIA attributes on ALL buttons
        tabButtons.forEach(btn => {
          btn.classList.remove('active');
          btn.setAttribute('aria-selected', 'false');
        });
        
        // 4. Remove the 'active' class from ALL panels
        tabPanels.forEach(panel => {
          panel.classList.remove('active');
        });

        // 5. Add the 'active' class to the button that was just clicked
        button.classList.add('active');
        button.setAttribute('aria-selected', 'true');

        // 6. Find the matching panel using the 'data-tab' attribute and make it active
        const targetTabId = button.getAttribute('data-tab');
        const targetPanel = document.getElementById(`ei-panel-${targetTabId}`);
        
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
      });
    });
  });
