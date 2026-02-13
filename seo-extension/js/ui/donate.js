let isInitialized = false;

export async function setupDonationListeners() {
    if (isInitialized) return;
    isInitialized = true;
    
    console.log('[Donation] Initializing listeners...');

    // 1. Header Coffee Icon Click (Persistent ID in Layout)
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#btn-header-donate');
        if (btn) {
            console.log('[Donation] Header coffee icon clicked');
            openDonateModal();
        }
    });

    // 2. Donation Bar Handling
    const donationBar = document.getElementById('donation-bar');
    if (donationBar) {
        // Frequency check
        const today = new Date().toISOString().split('T')[0];
        const storage = await chrome.storage.local.get(['lastDonationBarDate', 'donationBarCount']);
        let count = storage.donationBarCount || 0;
        
        if (storage.lastDonationBarDate !== today) count = 0;

        if (count < 2) {
            donationBar.style.display = 'flex';
            chrome.storage.local.set({ lastDonationBarDate: today, donationBarCount: count + 1 });
            
            donationBar.addEventListener('click', (e) => {
                if (e.target.closest('#btn-close-donation')) {
                    e.stopPropagation();
                    closeDonationBar();
                    return;
                }
                openDonateModal();
                closeDonationBar();
            });
        }
    }

    // 3. Modal Delegated Logic
    document.addEventListener('click', (e) => {
        const modal = document.getElementById('donate-modal');
        if (!modal || modal.style.display === 'none') return;

        // Backdrop Click
        if (e.target === modal) {
            console.log('[Donation] Backdrop clicked, closing...');
            closeDonateModal();
            return;
        }

        // Close Button
        if (e.target.closest('#btn-close-donate-modal')) {
            console.log('[Donation] Close button clicked');
            closeDonateModal();
            return;
        }

        // Preset Buttons
        const presetBtn = e.target.closest('.donation-preset-btn');
        if (presetBtn) {
            console.log('[Donation] Preset clicked:', presetBtn.dataset.amount);
            document.querySelectorAll('.donation-preset-btn').forEach(b => b.classList.remove('selected'));
            presetBtn.classList.add('selected');
            const customInput = document.getElementById('custom-donation-amount');
            if (customInput) customInput.value = '';
            updatePriceDisplay();
            return;
        }
    });

    // Custom Input Listeners
    document.addEventListener('input', (e) => {
        if (e.target.id === 'custom-donation-amount') {
            document.querySelectorAll('.donation-preset-btn').forEach(b => b.classList.remove('selected'));
            updatePriceDisplay();
        }
    });
}

/**
 * Helpers
 */
export function openDonateModal() {
    const modal = document.getElementById('donate-modal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    modal.offsetHeight; // Reflow
    modal.classList.add('open');
    updatePriceDisplay(); // Initial render
}

export function closeDonateModal() {
    const modal = document.getElementById('donate-modal');
    if (!modal) return;
    
    modal.classList.remove('open');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function closeDonationBar() {
    const bar = document.getElementById('donation-bar');
    if (!bar) return;
    bar.classList.add('hidden');
    setTimeout(() => bar.style.display = 'none', 300);
}

function updatePriceDisplay() {
    const selectedPreset = document.querySelector('.donation-preset-btn.selected');
    const customInput = document.getElementById('custom-donation-amount');
    
    const amount = selectedPreset ? selectedPreset.dataset.amount : (customInput?.value || 5);
    
    renderPayPalButton(amount);
}

function renderPayPalButton(amount) {
    const container = document.getElementById('paypal-button-container');
    if (!container) return;

    container.innerHTML = '';
    const label = `Donate $${amount}`;

    const payBtn = document.createElement('button');
    payBtn.className = 'action-btn primary';
    payBtn.style.cssText = `
        width: 100%; height: 48px; background: #ffc439; color: #000; 
        font-weight: 700; border: none; border-radius: 24px; cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 8px;
    `;
    payBtn.innerHTML = `<i class="fa-brands fa-paypal"></i> ${label}`;
    
    payBtn.onclick = () => {
        console.log('[Donation] Proceeding to PayPal with:', { amount });
        
        // Use standard Pay Now link for personal accounts
        const url = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=vaiyyy@gmail.com&amount=${amount}&currency_code=USD&item_name=SEO+Analyzer+Pro+Support`;
            
        window.open(url, '_blank');
        closeDonateModal();
    };

    container.appendChild(payBtn);
}
