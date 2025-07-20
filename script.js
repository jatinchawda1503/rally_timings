// Rally Timing Coordinator Application
class RallyCoordinator {
    constructor() {
        this.rallyLeaders = [];
        this.isCoordinationActive = false;
        this.countdownInterval = null;
        this.coordinationInterval = null;
        this.coordinationStartTime = null;
        
        this.initializeElements();
        this.bindEvents();
        this.updateUI();
    }

    initializeElements() {
        // Form elements
        this.rallyForm = document.getElementById('rallyForm');
        this.leaderNameInput = document.getElementById('leaderName');
        this.marchTimeInput = document.getElementById('marchTime');
        this.delayInput = document.getElementById('delay');
        
        // Display elements
        this.rallyList = document.getElementById('rallyList');
        this.rallyCount = document.getElementById('rallyCount');
        
        // Overview elements
        this.overviewSection = document.getElementById('overviewSection');
        this.overviewList = document.getElementById('overviewList');
        this.overviewCount = document.getElementById('overviewCount');
        this.totalCoordinationTime = document.getElementById('totalCoordinationTime');
        this.arrivalTimeElement = document.getElementById('arrivalTime');
        
        // Control elements
        this.clearAllBtn = document.getElementById('clearAll');
        this.startCoordinationBtn = document.getElementById('startCoordination');
        this.startFromOverviewBtn = document.getElementById('startFromOverview');
        this.stopCoordinationBtn = document.getElementById('stopCoordination');
        
        // Coordination elements
        this.coordinationSection = document.getElementById('coordinationSection');
        this.countdownTimer = document.getElementById('countdownTimer');
        this.statusText = document.getElementById('statusText');
        this.launchSequence = document.getElementById('launchSequence');
        
        // Audio element
        this.countdownAudio = document.getElementById('countdownAudio');
    }

    bindEvents() {
        this.rallyForm.addEventListener('submit', (e) => this.handleAddRally(e));
        this.clearAllBtn.addEventListener('click', () => this.clearAllRallies());
        this.startCoordinationBtn.addEventListener('click', () => this.startCoordination());
        this.startFromOverviewBtn.addEventListener('click', () => this.startCoordination());
        this.stopCoordinationBtn.addEventListener('click', () => this.stopCoordination());
    }

    handleAddRally(e) {
        e.preventDefault();
        
        const name = this.leaderNameInput.value.trim();
        const marchTime = parseFloat(this.marchTimeInput.value);
        const delay = parseFloat(this.delayInput.value) || 0;
        
        if (!name || !marchTime || marchTime <= 0) {
            this.showNotification('Please fill in all required fields with valid values', 'error');
            return;
        }
        
        // Check for duplicate names
        if (this.rallyLeaders.some(leader => leader.name.toLowerCase() === name.toLowerCase())) {
            this.showNotification('A leader with this name already exists', 'error');
            return;
        }
        
        const rallyLeader = {
            id: Date.now() + Math.random(),
            name: name,
            marchTime: marchTime,
            delay: delay,
            totalTime: marchTime + delay,
            startTime: null,
            status: 'waiting'
        };
        
        this.rallyLeaders.push(rallyLeader);
        this.sortRallyLeaders();
        this.updateUI();
        this.resetForm();
        this.showNotification(`${name} added successfully!`, 'success');
    }

    sortRallyLeaders() {
        // Sort by total time (march time + delay) in descending order
        // Leaders with longer total times need to start first
        this.rallyLeaders.sort((a, b) => b.totalTime - a.totalTime);
    }

    removeRallyLeader(id) {
        this.rallyLeaders = this.rallyLeaders.filter(leader => leader.id !== id);
        this.updateUI();
        this.showNotification('Rally leader removed', 'info');
    }

    editRallyLeader(id) {
        // Hide display and show edit form
        const detailsElement = document.getElementById(`rally-details-${id}`);
        const editElement = document.getElementById(`rally-edit-${id}`);
        
        if (detailsElement && editElement) {
            detailsElement.style.display = 'none';
            editElement.style.display = 'block';
        }
    }

    saveRallyEdit(id) {
        const marchInput = document.getElementById(`edit-march-${id}`);
        const delayInput = document.getElementById(`edit-delay-${id}`);
        
        if (!marchInput || !delayInput) return;
        
        const newMarchTime = parseFloat(marchInput.value);
        const newDelay = parseFloat(delayInput.value);
        
        // Validate inputs
        if (!newMarchTime || newMarchTime <= 0) {
            this.showNotification('March time must be greater than 0', 'error');
            return;
        }
        
        if (newDelay < 0) {
            this.showNotification('Delay cannot be negative', 'error');
            return;
        }
        
        // Find and update the rally leader
        const leader = this.rallyLeaders.find(l => l.id === id);
        if (leader) {
            leader.marchTime = newMarchTime;
            leader.delay = newDelay || 0;
            leader.totalTime = leader.marchTime + leader.delay;
            
            // Re-sort the list since total time might have changed
            this.sortRallyLeaders();
            this.updateUI();
            this.showNotification(`${leader.name} updated successfully!`, 'success');
        }
    }

    cancelRallyEdit(id) {
        // Show display and hide edit form
        const detailsElement = document.getElementById(`rally-details-${id}`);
        const editElement = document.getElementById(`rally-edit-${id}`);
        
        if (detailsElement && editElement) {
            detailsElement.style.display = 'block';
            editElement.style.display = 'none';
        }
    }

    clearAllRallies() {
        if (this.isCoordinationActive) {
            this.showNotification('Cannot clear rallies during active coordination', 'error');
            return;
        }
        
        this.rallyLeaders = [];
        this.updateUI();
        this.showNotification('All rally leaders cleared', 'info');
    }

    updateUI() {
        this.updateRallyList();
        this.updateControls();
        this.updateRallyCount();
        this.updateOverview();
    }

    updateRallyList() {
        if (this.rallyLeaders.length === 0) {
            this.rallyList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users-slash"></i>
                    <p>No rally leaders added yet</p>
                    <small>Add rally leaders to start coordinating attacks</small>
                </div>
            `;
            return;
        }

        this.rallyList.innerHTML = this.rallyLeaders.map(leader => `
            <div class="rally-item" data-id="${leader.id}">
                <div class="rally-item-header">
                    <span class="rally-leader-name">${leader.name}</span>
                    <div class="rally-actions">
                        <button class="edit-btn" onclick="rallyCoordinator.editRallyLeader(${leader.id})" 
                                ${this.isCoordinationActive ? 'disabled' : ''}>
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" onclick="rallyCoordinator.removeRallyLeader(${leader.id})" 
                                ${this.isCoordinationActive ? 'disabled' : ''}>
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="rally-details" id="rally-details-${leader.id}">
                    <div class="detail-item">
                        <i class="fas fa-clock"></i>
                        March: <span class="detail-value">${leader.marchTime}s</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-hourglass-half"></i>
                        Delay: <span class="detail-value">${leader.delay}s</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-calculator"></i>
                        Total: <span class="detail-value">${leader.totalTime}s</span>
                    </div>
                </div>
                <div class="rally-edit-form" id="rally-edit-${leader.id}" style="display: none;">
                    <div class="edit-inputs">
                        <div class="edit-input-group">
                            <label><i class="fas fa-clock"></i> March Time (s):</label>
                            <input type="number" id="edit-march-${leader.id}" value="${leader.marchTime}" min="1" step="1">
                        </div>
                        <div class="edit-input-group">
                            <label><i class="fas fa-hourglass-half"></i> Delay (s):</label>
                            <input type="number" id="edit-delay-${leader.id}" value="${leader.delay}" min="0" step="1">
                        </div>
                    </div>
                    <div class="edit-actions">
                        <button class="btn btn-primary btn-small" onclick="rallyCoordinator.saveRallyEdit(${leader.id})">
                            <i class="fas fa-save"></i> Save
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="rallyCoordinator.cancelRallyEdit(${leader.id})">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateControls() {
        const hasLeaders = this.rallyLeaders.length > 0;
        this.clearAllBtn.disabled = !hasLeaders || this.isCoordinationActive;
        this.startCoordinationBtn.disabled = !hasLeaders || this.isCoordinationActive;
        if (this.startFromOverviewBtn) {
            this.startFromOverviewBtn.disabled = !hasLeaders || this.isCoordinationActive;
        }
    }

    updateRallyCount() {
        this.rallyCount.textContent = this.rallyLeaders.length;
    }

    updateOverview() {
        if (this.rallyLeaders.length === 0 || this.isCoordinationActive) {
            this.overviewSection.style.display = 'none';
            return;
        }

        this.overviewSection.style.display = 'block';
        this.overviewCount.textContent = this.rallyLeaders.length;
        
        const launchSequence = this.calculateLaunchTimes();
        this.populateOverview(launchSequence);
    }

    populateOverview(launchSequence) {
        if (launchSequence.length === 0) {
            this.overviewList.innerHTML = '<p class="no-data">No rally leaders to display</p>';
            return;
        }

        // Calculate timing information
        const maxStartOffset = Math.max(...launchSequence.map(l => l.startOffset));
        const finalArrivalTime = launchSequence[0].finalArrivalTime;

        this.totalCoordinationTime.textContent = `${maxStartOffset}s`;
        this.arrivalTimeElement.textContent = `${finalArrivalTime}s`;

        // Generate overview list
        this.overviewList.innerHTML = launchSequence.map((leader, index) => {
            const position = index + 1;
            const startTime = leader.startOffset;
            
            return `
                <div class="overview-item">
                    <div class="overview-position">
                        <span class="position-number">${position}</span>
                        <span class="position-label">${position === 1 ? '1st' : position === 2 ? '2nd' : position === 3 ? '3rd' : position + 'th'}</span>
                    </div>
                    <div class="overview-leader">
                        <div class="leader-name">${leader.name}</div>
                        <div class="leader-stats">
                            <span class="stat-item">
                                <i class="fas fa-clock"></i>
                                March: ${leader.marchTime}s
                            </span>
                            <span class="stat-item">
                                <i class="fas fa-hourglass-half"></i>
                                Delay: ${leader.delay}s
                            </span>
                            <span class="stat-item total">
                                <i class="fas fa-calculator"></i>
                                Total: ${leader.totalTime}s
                            </span>
                        </div>
                    </div>
                    <div class="overview-timing">
                        <div class="start-time">
                            ${startTime === 0 ? 'Starts immediately' : `Starts in ${startTime}s`}
                        </div>
                        <div class="arrival-time">
                            Hits castle at ${leader.arrivalTime}s
                        </div>
                        <div class="timing-bar">
                            <div class="timing-fill" style="width: ${maxStartOffset > 0 ? (1 - startTime / maxStartOffset) * 100 : 100}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    calculateLaunchTimes() {
        if (this.rallyLeaders.length === 0) return [];
        
        // Calculate when each rally will arrive at the castle (march time + delay)
        const ralliesWithArrivalTime = this.rallyLeaders.map(leader => ({
            ...leader,
            arrivalTime: leader.marchTime + leader.delay // When this rally hits the castle
        }));
        
        // Find the latest arrival time (when the last rally will hit)
        const targetArrivalTime = Math.max(...ralliesWithArrivalTime.map(r => r.arrivalTime));
        
        // Calculate when each leader should start to hit at the target time
        return ralliesWithArrivalTime.map(leader => ({
            ...leader,
            startOffset: targetArrivalTime - leader.arrivalTime, // How long before target time to start
            finalArrivalTime: targetArrivalTime // When everyone will have arrived
        })).sort((a, b) => a.startOffset - b.startOffset); // Sort by start time (earliest first)
    }

    startCoordination() {
        if (this.rallyLeaders.length === 0) {
            this.showNotification('Add rally leaders before starting coordination', 'error');
            return;
        }

        this.isCoordinationActive = true;
        this.coordinationSection.style.display = 'block';
        this.updateControls();
        
        // Calculate launch sequence
        const launchSequence = this.calculateLaunchTimes();
        this.displayLaunchSequence(launchSequence);
        
        // Smooth scroll to coordination section after a brief delay
        setTimeout(() => {
            this.coordinationSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 100);
        
        // Start 5-second countdown
        this.startCountdown();
        
        this.showNotification('Coordination started! Get ready!', 'success');
    }

    startCountdown() {
        let countdown = 5;
        this.countdownTimer.textContent = countdown;
        this.statusText.textContent = 'Preparing for coordination...';
        
        this.countdownInterval = setInterval(() => {
            countdown--;
            this.countdownTimer.textContent = countdown;
            
            if (countdown > 0) {
                this.statusText.textContent = `Coordination starts in ${countdown} seconds...`;
                this.playCountdownSound();
            } else {
                clearInterval(this.countdownInterval);
                this.startLaunchSequence();
            }
        }, 1000);
    }

    startLaunchSequence() {
        this.coordinationStartTime = Date.now();
        this.countdownTimer.textContent = 'ACTIVE';
        this.statusText.textContent = 'Coordination active - follow the launch sequence!';
        
        const launchSequence = this.calculateLaunchTimes();
        
        // Update launch sequence every second
        this.coordinationInterval = setInterval(() => {
            this.updateLaunchSequence(launchSequence);
        }, 1000);
        
        this.playCountdownSound();
    }

    updateLaunchSequence(launchSequence) {
        const elapsed = (Date.now() - this.coordinationStartTime) / 1000; // seconds elapsed
        
        launchSequence.forEach((leader, index) => {
            const launchTimeSeconds = leader.startOffset;
            
            let status = 'waiting';
            let statusText = 'Waiting';
            
            if (elapsed >= launchTimeSeconds - 30 && elapsed < launchTimeSeconds) {
                // 30 seconds before launch
                status = 'ready';
                const secondsToLaunch = Math.ceil(launchTimeSeconds - elapsed);
                statusText = `Ready in ${secondsToLaunch}s`;
            } else if (elapsed >= launchTimeSeconds && elapsed < launchTimeSeconds + 30) {
                // Launch window (30 seconds)
                status = 'go';
                statusText = 'LAUNCH NOW!';
            } else if (elapsed >= launchTimeSeconds + 30) {
                // After launch window
                status = 'completed';
                statusText = 'Launched';
            }
            
            // Update the visual status
            const launchElement = document.querySelector(`[data-launch-id="${leader.id}"]`);
            if (launchElement) {
                const statusElement = launchElement.querySelector('.launch-status');
                statusElement.className = `launch-status ${status}`;
                statusElement.textContent = statusText;
                
                launchElement.className = `launch-item ${status === 'ready' || status === 'go' ? 'active' : ''} ${status === 'completed' ? 'completed' : ''}`;
            }
        });
        
        // Update main status
        const currentLaunching = launchSequence.find(leader => {
            const launchTimeSeconds = leader.startOffset * 60;
            return elapsed >= launchTimeSeconds - 30 && elapsed < launchTimeSeconds + 30;
        });
        
        if (currentLaunching) {
            const launchTimeSeconds = currentLaunching.startOffset * 60;
            if (elapsed >= launchTimeSeconds && elapsed < launchTimeSeconds + 30) {
                this.statusText.textContent = `🚀 ${currentLaunching.name} - LAUNCH NOW!`;
                this.statusText.style.color = 'var(--success-color)';
                this.statusText.style.fontWeight = 'bold';
            } else {
                this.statusText.textContent = `⏰ ${currentLaunching.name} ready to launch soon...`;
                this.statusText.style.color = 'var(--warning-color)';
                this.statusText.style.fontWeight = 'normal';
            }
        }
        
        // Check if all rallies have been launched
        const allLaunched = launchSequence.every(leader => {
            const launchTimeSeconds = leader.startOffset;
            return elapsed >= launchTimeSeconds + 30;
        });
        
        if (allLaunched) {
            const finalArrivalTime = launchSequence[0].finalArrivalTime;
            const timeToArrival = finalArrivalTime - elapsed;
            
            if (timeToArrival > 0) {
                this.statusText.textContent = `✅ All rallies launched! Final arrival in ${timeToArrival.toFixed(0)} seconds`;
                this.statusText.style.color = 'var(--success-color)';
            } else {
                this.statusText.textContent = '🏰 All rallies should have arrived at the castle!';
                this.statusText.style.color = 'var(--success-color)';
                this.statusText.style.fontWeight = 'bold';
            }
        }
    }

    displayLaunchSequence(launchSequence) {
        this.launchSequence.innerHTML = launchSequence.map(leader => `
            <div class="launch-item" data-launch-id="${leader.id}">
                <div class="launch-info">
                    <span class="launch-name">${leader.name}</span>
                    <span class="launch-time">Starts in ${leader.startOffset.toFixed(0)} seconds</span>
                </div>
                <div class="launch-status waiting">Waiting</div>
            </div>
        `).join('');
    }

    stopCoordination() {
        this.isCoordinationActive = false;
        this.coordinationSection.style.display = 'none';
        
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        
        if (this.coordinationInterval) {
            clearInterval(this.coordinationInterval);
            this.coordinationInterval = null;
        }
        
        this.coordinationStartTime = null;
        this.updateControls();
        this.statusText.style.color = '';
        this.statusText.style.fontWeight = '';
        
        this.showNotification('Coordination stopped', 'info');
    }

    playCountdownSound() {
        try {
            // Create a simple beep sound using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Audio playback not available');
        }
    }

    showNotification(message, type = 'info') {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        `;
        
        // Add notification styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--danger-color)' : 'var(--primary-color)'};
            color: white;
            padding: 15px 20px;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 500;
            animation: slideInFromRight 0.3s ease-out;
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutToRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    resetForm() {
        this.rallyForm.reset();
        this.leaderNameInput.focus();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.rallyCoordinator = new RallyCoordinator();
});

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideOutToRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(notificationStyles); 