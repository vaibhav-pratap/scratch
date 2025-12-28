
/**
 * iOS-style Calendar Modal for Date Range Selection
 */

export const CalendarModal = {
    state: {
        currentMonth: new Date(),
        selection: {
            start: null, // Date object
            end: null    // Date object
        },
        onApply: null
    },

    init() {
        if (!document.getElementById('calendar-modal-root')) {
            const root = document.createElement('div');
            root.id = 'calendar-modal-root';
            root.className = 'calendar-backdrop';
            root.innerHTML = `
                <div class="calendar-modal">
                    <div class="calendar-header">
                        <button class="month-nav-btn" id="cal-prev">
                            <i class="fa-solid fa-chevron-left"></i>
                        </button>
                        <div class="current-month" id="cal-title">Month Year</div>
                        <button class="month-nav-btn" id="cal-next">
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                    </div>
                    <div class="calendar-grid" id="cal-grid">
                        <!-- Headers & Days -->
                    </div>
                    <div class="calendar-footer">
                        <button class="calendar-btn-cancel" id="cal-cancel">Cancel</button>
                        <div class="calendar-info-text" id="cal-info">Select dates</div>
                        <button class="calendar-btn-apply" id="cal-apply">Apply</button>
                    </div>
                </div>
            `;
            document.body.appendChild(root);

            // Bind Events
            root.querySelector('#cal-prev').addEventListener('click', () => this.changeMonth(-1));
            root.querySelector('#cal-next').addEventListener('click', () => this.changeMonth(1));
            root.querySelector('#cal-cancel').addEventListener('click', () => this.close());
            root.querySelector('#cal-apply').addEventListener('click', () => this.submit());

            // Close on backdrop click (but not modal click)
            root.addEventListener('click', (e) => {
                if (e.target === root) this.close();
            });
        }
    },

    open(initialStart, initialEnd, onApply) {
        this.init();
        this.state.onApply = onApply;

        // Parse Inputs
        const today = new Date();
        // Reset to today if invalid or null
        this.state.selection.start = initialStart ? new Date(initialStart) : null;
        this.state.selection.end = initialEnd ? new Date(initialEnd) : null;

        // Set view to start date or today
        this.state.currentMonth = this.state.selection.start
            ? new Date(this.state.selection.start)
            : new Date();
        this.state.currentMonth.setDate(1); // Ensure 1st of month

        this.render();

        const root = document.getElementById('calendar-modal-root');
        root.style.display = 'flex';
        // Trigger reflow for transition
        root.offsetHeight;
        root.classList.add('show');
    },

    close() {
        const root = document.getElementById('calendar-modal-root');
        if (root) {
            root.classList.remove('show');
            setTimeout(() => {
                root.style.display = 'none';
            }, 200);
        }
    },

    submit() {
        if (this.state.onApply) {
            const { start, end } = this.state.selection;
            // Format YYYY-MM-DD
            const fmt = (d) => {
                if (!d) return null;
                const offset = d.getTimezoneOffset();
                const local = new Date(d.getTime() - (offset * 60 * 1000));
                return local.toISOString().split('T')[0];
            };

            // If only start is selected, treat as single day (start=end)
            const s = fmt(start);
            const e = end ? fmt(end) : s;

            this.state.onApply({ start: s, end: e });
        }
        this.close();
    },

    changeMonth(delta) {
        this.state.currentMonth.setMonth(this.state.currentMonth.getMonth() + delta);
        this.render();
    },

    render() {
        const title = document.getElementById('cal-title');
        const grid = document.getElementById('cal-grid');
        const info = document.getElementById('cal-info');

        const year = this.state.currentMonth.getFullYear();
        const month = this.state.currentMonth.getMonth();

        // Update Title
        title.textContent = this.state.currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        // Generate Grid HTML
        let html = '';
        const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        weekdays.forEach(d => html += `<div class="weekday-header">${d}</div>`);

        // First day of month
        const firstDay = new Date(year, month, 1).getDay();
        // Days in month
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Empty slots
        for (let i = 0; i < firstDay; i++) {
            html += `<div class="calendar-day empty"></div>`;
        }

        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const current = new Date(year, month, d);
            const classes = ['calendar-day'];
            const { start, end } = this.state.selection;

            // Normalize time for comparison
            const t = current.setHours(0, 0, 0, 0);
            const s = start ? new Date(start).setHours(0, 0, 0, 0) : null;
            const e = end ? new Date(end).setHours(0, 0, 0, 0) : null;

            if (s && t === s) {
                classes.push('selected', 'range-start');
                if (!e || e === s) classes.push('single');
            } else if (e && t === e) {
                classes.push('selected', 'range-end');
            } else if (s && e && t > s && t < e) {
                classes.push('in-range');
            }

            html += `<div class="${classes.join(' ')}" data-day="${d}">${d}</div>`;
        }

        grid.innerHTML = html;

        // Attach click handlers to days
        grid.querySelectorAll('.calendar-day[data-day]').forEach(dayEl => {
            dayEl.addEventListener('click', (e) => {
                const day = parseInt(e.target.dataset.day);
                this.handleDayClick(new Date(year, month, day));
            });
        });

        // Update Info Text
        const { start, end } = this.state.selection;
        if (start && end) {
            const opts = { month: 'short', day: 'numeric' };
            info.textContent = `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`;
        } else if (start) {
            info.textContent = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
            info.textContent = 'Select dates';
        }
    },

    handleDayClick(date) {
        const { start, end } = this.state.selection;

        // Reset time
        const target = date.getTime();
        const s = start ? start.getTime() : null;
        const e = end ? end.getTime() : null;

        if (!s) {
            // Case 1: No selection -> Set Start
            this.state.selection.start = date;
            this.state.selection.end = null;
        } else if (s && !e) {
            // Case 2: Start exists, End empty
            if (target < s) {
                // Clicked before start -> New Start
                this.state.selection.start = date;
            } else if (target > s) {
                // Clicked after start -> Set End
                this.state.selection.end = date;
            } else {
                // Clicked same -> Deselect? Or keep single? Keep.
                this.state.selection.end = null;
            }
        } else if (s && e) {
            // Case 3: Range exists -> Click starts new selection
            this.state.selection.start = date;
            this.state.selection.end = null;
        }

        this.render();
    }
};
