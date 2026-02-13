/**
 * Donation Module
 * Handles the "Buy me a coffee" modal logic and PayPal integration.
 */

export async function setupDonationListeners() {
    const donationBar = document.getElementById('donation-bar');
    const closeBarBtn = document.getElementById('btn-close-donation');
    const donateModal = document.getElementById('donate-modal');
    const presetBtns = document.querySelectorAll('.donation-preset-btn');
    const customInput = document.getElementById('custom-donation-amount');

    if (!donationBar || !donateModal) return;

    // --- Frequency Limit Logic ---
    const today = new Date().toISOString().split('T')[0];
    const storage = await chrome.storage.local.get(['lastDonationBarDate', 'donationBarCount']);
    
    let count = storage.donationBarCount || 0;
    if (storage.lastDonationBarDate !== today) {
        count = 0; // Reset for a new day
    }

    if (count >= 2) {
        donationBar.style.display = 'none';
        return;
    }

    // Show the bar and increment the count
    donationBar.style.display = 'flex';
    chrome.storage.local.set({
        lastDonationBarDate: today,
        donationBarCount: count + 1
    });
    // --- End Frequency Limit Logic ---

    // Open Modal from Bar
    donationBar.addEventListener('click', (e) => {
        if (e.target.closest('#btn-close-donation')) return;
        
        // Open Modal
        donateModal.classList.add('open');
        renderPayPalButton(5); // Default to $5

        // Automatically hide the bar with animation
        donationBar.classList.add('hidden');
        setTimeout(() => {
            donationBar.style.display = 'none';
        }, 300);
    });

    // Close Bar with animation
    if (closeBarBtn) {
        closeBarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            donationBar.classList.add('hidden');
            setTimeout(() => {
                donationBar.style.display = 'none';
            }, 300);
        });
    }

    // Handle Preset Selection
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            presetBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            const amount = btn.dataset.amount;
            customInput.value = ''; // Clear custom input
            updatePayPalLogic(amount);
        });
    });

    // Handle Custom Amount
    customInput.addEventListener('input', () => {
        presetBtns.forEach(b => b.classList.remove('selected'));
        const amount = customInput.value;
        if (amount > 0) {
            updatePayPalLogic(amount);
        }
    });

    // Close Modal on Backdrop Click
    donateModal.addEventListener('click', (e) => {
        if (e.target === donateModal) {
            donateModal.style.display = 'none';
        }
    });
}

/**
 * Updates the donation link or logic based on amount
 */
function updatePayPalLogic(amount) {
    const container = document.getElementById('paypal-button-container');
    if (!container) return;

    // Clear previous button
    container.innerHTML = '';

    // Create a secure PayPal Donation Button (Simulated via a styled button for Manifest V3 compliance)
    const payBtn = document.createElement('button');
    payBtn.className = 'action-btn primary';
    payBtn.style.width = '100%';
    payBtn.style.height = '48px';
    payBtn.style.background = '#ffc439';
    payBtn.style.color = '#000';
    payBtn.style.fontWeight = '700';
    payBtn.style.border = 'none';
    payBtn.innerHTML = `<i class="fa-brands fa-paypal" style="margin-right: 8px;"></i> Donate $${amount} via PayPal`;
    
    payBtn.onclick = () => {
        const paypalMeUrl = `https://paypal.me/vaiyyy/${amount}USD`;
        window.open(paypalMeUrl, '_blank');
        
        // Close modal after redirection
        const donateModal = document.getElementById('donate-modal');
        if (donateModal) donateModal.classList.remove('open');
    };

    container.appendChild(payBtn);
}

/**
 * Initial render of the PayPal button
 */
function renderPayPalButton(amount) {
    // Select the first preset as default
    const firstPreset = document.querySelector('.donation-preset-btn[data-amount="5"]');
    if (firstPreset) firstPreset.classList.add('selected');
    
    updatePayPalLogic(amount);
}
