document.addEventListener('DOMContentLoaded', () => {
    const portfolioModal = document.getElementById('portfolioModal');
    const closeModalButton = document.getElementById('closeModal');
    const modalTitle = document.getElementById('modalTitle');
    const sketchfabIframe = document.getElementById('sketchfabIframe');

    const portfolioItems = document.querySelectorAll('.creative-portfolio-item'); 

    // Function to open the modal
    const openModal = (title, sketchfabUrl) => {
        modalTitle.textContent = title;
        sketchfabIframe.src = sketchfabUrl;
        portfolioModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent scrolling background
    };

    // Function to close the modal
    const closeModal = () => {
        portfolioModal.classList.add('hidden');
        sketchfabIframe.src = ''; // Stop iframe content
        document.body.style.overflow = ''; // Restore scrolling
    };

    // Attach event listeners to portfolio items
    portfolioItems.forEach(item => {
        item.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default link navigation
            const title = item.querySelector('h3').textContent.trim(); // Get title from h3
            const sketchfabUrl = item.dataset.sketchfabUrl; // Get URL from data attribute
            if (sketchfabUrl) {
                openModal(title, sketchfabUrl);
            }
        });
    });

    // Attach event listeners to close button and modal overlay
    closeModalButton.addEventListener('click', closeModal);
    portfolioModal.addEventListener('click', (event) => {
        if (event.target === portfolioModal) { // Only close if clicking on the overlay itself
            closeModal();
        }
    });

    // Close with Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !portfolioModal.classList.contains('hidden')) {
            closeModal();
        }
    });
});
