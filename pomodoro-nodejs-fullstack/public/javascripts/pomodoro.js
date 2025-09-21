// pomodoro.js - Complete Pomodoro Timer JavaScript

// Global variables
let timerInterval;
let totalSeconds = 0;
let isRunning = false;
let isFullscreen = false;
let currentSession = null;
let facebookName = 'Guest User';
let notesData = '';
let currentMode = 'study'; // 'study' or 'break'
let currentBlockRemaining = 0; // Seconds left in current block
let breakTimeElapsed = 0; // Track break time separately
let instagramWindow = null; // Track Instagram browser tab

// Configuration with localStorage persistence
let config = JSON.parse(localStorage.getItem('pomodoroConfig')) || {
  purpose: 'General Study',
  duration: 25,
  cycles: 1,
  breakDuration: 5,
  background: null,
  fontFamily: 'Open Sans, sans-serif',
  fontWeight: 'bold'
};

// DOM Elements
const elements = {
  classicBtn: document.getElementById('classic-btn'),
  customizeBtn: document.getElementById('customize-btn'),
  customizeDropdown: document.getElementById('customizeDropdown'),
  purposeInput: document.getElementById('purposeInput'),
  durationInput: document.getElementById('durationInput'),
  bgInput: document.getElementById('bgInput'),
  fontInput: document.getElementById('fontInput'),
  weightInput: document.getElementById('weightInput'),
  cycleInput: document.getElementById('cycleInput'),
  breakDurationInput: document.getElementById('breakDurationInput'),
  saveCustomize: document.getElementById('saveCustomize'),
  cancelCustomize: document.getElementById('cancelCustomize'),
  timerText: document.getElementById('timerText'),
  startBtn: document.getElementById('startBtn'),
  preStartControls: document.getElementById('preStartControls'),
  preStartActionButtons: document.getElementById('preStartActionButtons'),
  stopBtn: document.getElementById('stopBtn'),
  resetBtn: document.getElementById('resetBtn'),
  sessionControls: document.getElementById('sessionControls'),
  sessionInfo: document.getElementById('sessionInfo'),
  purposeText: document.getElementById('purposeText'),
  cycleCounter: document.getElementById('cycleCounter'),
  fullscreenOverlay: document.getElementById('fullscreenOverlay'),
  fullscreenTimerText: document.getElementById('fullscreenTimerText'),
  fullscreenPurposeText: document.getElementById('fullscreenPurposeText'),
  fullscreenCycleCounter: document.getElementById('fullscreenCycleCounter'),
  fullscreenSessionInfo: document.getElementById('fullscreenSessionInfo'),
  showNotesFullscreen: document.getElementById('showNotesFullscreen'),
  exitFullscreen: document.getElementById('exitFullscreen'),
  studyNotesPopup: document.getElementById('studyNotesPopup'),
  closeNotesBtn: document.getElementById('closeNotesBtn'),
  notesTextarea: document.getElementById('notesTextarea'),
  minimizeNotes: document.getElementById('minimizeNotes'),
  saveNotesBtn: document.getElementById('saveNotesBtn'),
  completionModal: document.getElementById('completionModal'),
  completionPurpose: document.getElementById('completionPurpose'),
  completionDuration: document.getElementById('completionDuration'),
  completionActual: document.getElementById('completionActual'),
  completionCycles: document.getElementById('completionCycles'),
  finalNotesInput: document.getElementById('finalNotesInput'),
  saveFinalSession: document.getElementById('saveFinalSession'),
  timerContainer: document.querySelector('.timer-container'),
  timerBg: document.getElementById('timerBg'),
  modeIndicator: document.getElementById('modeIndicator'),
  currentMode: document.getElementById('currentMode')
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  ('Pomodoro timer initialized');
  updateTimerStyles();
  
  // Ensure dropdown is hidden on load
  if (elements.customizeDropdown) {
    elements.customizeDropdown.style.display = 'none';
  }
  
  // Event Listeners
  if (elements.classicBtn) elements.classicBtn.addEventListener('click', useClassicSettings);
  if (elements.customizeBtn) elements.customizeBtn.addEventListener('click', toggleCustomize);
  if (elements.saveCustomize) elements.saveCustomize.addEventListener('click', saveCustomizeSettings);
  if (elements.cancelCustomize) elements.cancelCustomize.addEventListener('click', cancelCustomize);
  if (elements.startBtn) elements.startBtn.addEventListener('click', startTimer);
  if (elements.stopBtn) elements.stopBtn.addEventListener('click', handleStop);
  if (elements.resetBtn) elements.resetBtn.addEventListener('click', handleReset);
  if (elements.closeNotesBtn) elements.closeNotesBtn.addEventListener('click', hideStudyNotes);
  if (elements.minimizeNotes) elements.minimizeNotes.addEventListener('click', hideStudyNotes);
  if (elements.saveNotesBtn) elements.saveNotesBtn.addEventListener('click', saveStudyNotes);
  if (elements.showNotesFullscreen) elements.showNotesFullscreen.addEventListener('click', showStudyNotes);
  if (elements.exitFullscreen) elements.exitFullscreen.addEventListener('click', exitFullscreenMode);
  if (elements.saveFinalSession) elements.saveFinalSession.addEventListener('click', saveFinalSession);
  
  // Facebook integration
  if (typeof FB !== 'undefined' && FB.getLoginStatus) {
    FB.getLoginStatus(function(response) {
      if (response.status === 'connected') {
        FB.api('/me', {fields: 'name'}, function(user) {
          if (user && !user.error) {
            facebookName = user.name;
            ('Facebook user:', facebookName);
          }
        });
      }
    });
  }
  
  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if (isRunning && e.key === 'Escape') {
      if (elements.studyNotesPopup && elements.studyNotesPopup.classList.contains('d-none')) {
        showStudyNotes();
      } else {
        hideStudyNotes();
      }
    }
  });
});

// Timer Display Functions
function updateTimerDisplay() {
  let displaySeconds = currentBlockRemaining;
  const hours = Math.floor(displaySeconds / 3600);
  const minutes = Math.floor((displaySeconds % 3600) / 60);
  const seconds = displaySeconds % 60;
  
  const displayTime = 
    `${hours.toString().padStart(2, '0')}:` +
    `${minutes.toString().padStart(2, '0')}:` +
    `${seconds.toString().padStart(2, '0')}`;
  
  if (elements.timerText) elements.timerText.textContent = displayTime;
  if (isFullscreen && elements.fullscreenTimerText) {
    elements.fullscreenTimerText.textContent = displayTime;
  }
}

function updateModeDisplay() {
  if (elements.modeIndicator) elements.modeIndicator.classList.remove('d-none');
  if (elements.currentMode) {
    elements.currentMode.textContent = currentMode.charAt(0).toUpperCase() + currentMode.slice(1);
  }
  
  // Update timer container styling based on mode
  if (elements.timerContainer) {
    elements.timerContainer.classList.remove('running', 'break-mode');
    if (isRunning) {
      elements.timerContainer.classList.add('running');
      if (currentMode === 'break') {
        elements.timerContainer.classList.add('break-mode');
      }
    }
  }
}

// Styling Functions
function updateTimerStyles() {
  if (!document.documentElement) return;
  document.documentElement.style.setProperty('--timer-font-family', config.fontFamily);
  document.documentElement.style.setProperty('--timer-font-weight', config.fontWeight);
  
  if (config.background && elements.timerBg) {
    elements.timerBg.style.backgroundImage = `url(${config.background})`;
    elements.timerBg.classList.remove('d-none');
  } else if (elements.timerBg) {
    elements.timerBg.classList.add('d-none');
  }
}

// Configuration Functions
function useClassicSettings() {
  config = {
    purpose: 'General Study',
    duration: 25,
    cycles: 4,
    breakDuration: 5,
    background: null,
    fontFamily: 'Open Sans, sans-serif',
    fontWeight: 'bold'
  };
  localStorage.setItem('pomodoroConfig', JSON.stringify(config));
  updateTimerStyles();
  if (elements.customizeDropdown) elements.customizeDropdown.style.display = 'none';
  if (elements.classicBtn) {
    elements.classicBtn.classList.add('active', 'btn-primary');
    elements.classicBtn.classList.remove('btn-outline-primary');
  }
  if (elements.customizeBtn) {
    elements.customizeBtn.classList.remove('active', 'btn-primary');
    elements.customizeBtn.classList.add('btn-outline-secondary');
  }
}

function toggleCustomize() {
  const isVisible = elements.customizeDropdown && elements.customizeDropdown.style.display !== 'none';
  
  if (isVisible) {
    if (elements.customizeDropdown) elements.customizeDropdown.style.display = 'none';
    if (elements.customizeBtn) {
      elements.customizeBtn.classList.remove('active', 'btn-primary');
      elements.customizeBtn.classList.add('btn-outline-secondary');
    }
  } else {
    if (elements.customizeDropdown) elements.customizeDropdown.style.display = 'block';
    if (elements.customizeBtn) {
      elements.customizeBtn.classList.add('active', 'btn-primary');
      elements.customizeBtn.classList.remove('btn-outline-secondary');
    }
    if (elements.classicBtn) {
      elements.classicBtn.classList.remove('active', 'btn-primary');
      elements.classicBtn.classList.add('btn-outline-primary');
    }
    
    // Populate form with current settings
    if (elements.purposeInput) elements.purposeInput.value = config.purpose;
    if (elements.durationInput) elements.durationInput.value = config.duration;
    if (elements.bgInput) elements.bgInput.value = config.background || '';
    if (elements.fontInput) elements.fontInput.value = config.fontFamily;
    if (elements.weightInput) elements.weightInput.value = config.fontWeight;
    if (elements.cycleInput) elements.cycleInput.value = config.cycles;
    if (elements.breakDurationInput) elements.breakDurationInput.value = config.breakDuration || 5;
  }
}

function saveCustomizeSettings(e) {
  e.preventDefault();
  
  const purpose = elements.purposeInput ? elements.purposeInput.value.trim() : '';
  const duration = parseInt(elements.durationInput ? elements.durationInput.value : 25);
  const cycles = parseInt(elements.cycleInput ? elements.cycleInput.value : 1);
  const breakDuration = parseInt(elements.breakDurationInput ? elements.breakDurationInput.value : 5);
  
  if (!purpose) {
    alert('Purpose is required');
    if (elements.purposeInput) elements.purposeInput.focus();
    return;
  }
  
  if (duration < 0) {
    alert('Duration must be at least 1 minute');
    if (elements.durationInput) elements.durationInput.focus();
    return;
  }
  
  if (cycles < 1) {
    alert('At least 1 cycle is required');
    if (elements.cycleInput) elements.cycleInput.focus();
    return;
  }
  
  if (breakDuration < 1) {
    alert('Break duration must be at least 1 minute');
    if (elements.breakDurationInput) elements.breakDurationInput.focus();
    return;
  }
  
  config = {
    purpose: purpose,
    duration: duration,
    cycles: cycles,
    breakDuration: breakDuration,
    background: elements.bgInput ? elements.bgInput.value.trim() || null : null,
    fontFamily: elements.fontInput ? elements.fontInput.value : 'Open Sans, sans-serif',
    fontWeight: elements.weightInput ? elements.weightInput.value : 'bold'
  };
  
  localStorage.setItem('pomodoroConfig', JSON.stringify(config));
  updateTimerStyles();
  toggleCustomize();
}

function cancelCustomize() {
  ('Canceling customize');
  toggleCustomize();
}

// Timer Control Functions
function startTimer() {
  ('Starting timer with config:', config);
  
  if (!config.purpose || !config.duration || config.duration < 0 || !config.cycles || config.cycles < 1 || !config.breakDuration) {
    alert('Please configure a valid session (use Classic or Customize)');
    toggleCustomize();
    return;
  }
  
  isRunning = true;
  totalSeconds = 0;
  breakTimeElapsed = 0;
  currentMode = 'study';
  currentSession = {
    purpose: config.purpose,
    studyTime: config.duration,
    actualStudyTime: 0, // Only study time in seconds
    restTime: config.breakDuration,
    cycles: config.cycles,
    completedCycles: 0,
    currentCycle: 1,
    isStoppedManually: false,
    totalElapsedSeconds: 0 // Total time including breaks
  };
  
  // Calculate study block duration per cycle with proper remainder handling
  const studyBlockSeconds = Math.floor((config.duration * 60) / config.cycles);
  const remainderSeconds = (config.duration * 60) % config.cycles;
  
  let currentStudyBlockDuration = studyBlockSeconds;
  if (remainderSeconds > 0 && currentSession.currentCycle <= remainderSeconds) {
    currentStudyBlockDuration += 1; // Distribute remainder seconds
  }
  
  currentBlockRemaining = currentStudyBlockDuration;
  
  (`Started session: ${config.duration} min total, ${config.cycles} cycles, Cycle 1: ${currentStudyBlockDuration} seconds`);
  
  // Hide pre-start UI, show session UI
  if (elements.preStartControls) elements.preStartControls.style.display = 'none';
  if (elements.preStartActionButtons) elements.preStartActionButtons.style.display = 'none';
  if (elements.sessionControls) elements.sessionControls.classList.remove('d-none');
  if (elements.sessionInfo) elements.sessionInfo.classList.remove('d-none');
  
  updateDisplay();
  updateModeDisplay();
  
  // Start timer interval
  timerInterval = setInterval(() => {
    if (currentMode === 'study') {
      totalSeconds++;
      currentSession.totalElapsedSeconds++;
      currentSession.actualStudyTime++;
    } else if (currentMode === 'break') {
      breakTimeElapsed++;
    }
    
    currentBlockRemaining--;
    
    // Check if current block is complete
    if (currentBlockRemaining <= 0) {
      if (currentMode === 'study') {
        // Study cycle completed
        currentSession.completedCycles++;
        (`✅ Cycle ${currentSession.completedCycles} completed! Study time so far: ${Math.floor(currentSession.actualStudyTime / 60)}m ${currentSession.actualStudyTime % 60}s`);
        
        if (currentSession.completedCycles < config.cycles) {
          // Start break
          currentMode = 'break';
          breakTimeElapsed = 0;
          currentBlockRemaining = config.breakDuration * 60;
          updateModeDisplay();
          showInstagramPopup();
          (`⏸️ Starting ${config.breakDuration} minute break...`);
        } else {
          // All cycles completed - session finished
          ('🎉 Session completed! Total study time:', Math.floor(currentSession.actualStudyTime / 60), 'minutes');
          stopTimer(true);
          showCompletionModal();
        }
      } else {
        // Break completed, start next study cycle
        hideInstagramPopup();
        currentMode = 'study';
        currentSession.currentCycle++;
        
        // Calculate duration for next cycle
        const nextStudyBlockSeconds = Math.floor((config.duration * 60) / config.cycles);
        const remainderForNext = (config.duration * 60) % config.cycles;
        let nextStudyBlockDuration = nextStudyBlockSeconds;
        
        if (remainderForNext > 0 && currentSession.currentCycle <= remainderForNext) {
          nextStudyBlockDuration += 1;
        }
        
        currentBlockRemaining = nextStudyBlockDuration;
        updateModeDisplay();
        (`▶️ Break ended, starting Cycle ${currentSession.currentCycle}: ${nextStudyBlockDuration} seconds`);
      }
    }
    
    // Update display every second
    updateDisplay();
  }, 1000);
  
  if (elements.timerContainer) elements.timerContainer.classList.add('running');
  enterFullscreenMode();
}

function handleStop() {
  if (!isRunning) return;
  
  clearInterval(timerInterval);
  isRunning = false;
  currentSession.isStoppedManually = true;
  
  if (elements.timerContainer) elements.timerContainer.classList.remove('running');
  hideInstagramPopup();
  
  (`Manual stop: Study time: ${Math.floor(currentSession.actualStudyTime / 60)} min, Total time: ${Math.floor(totalSeconds / 60)} min`);
  showStopModal();
}

function showStopModal() {
  const actualStudyMinutes = Math.floor(currentSession.actualStudyTime / 60);
  const actualStudySeconds = currentSession.actualStudyTime % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  
  const studyTimePerCycle = Math.floor((config.duration * 60) / config.cycles);
  const currentCycleNumber = Math.floor(currentSession.actualStudyTime / studyTimePerCycle) + 1;
  const displayCurrentCycle = Math.min(currentCycleNumber, config.cycles);
  
  const cycleProgress = (currentSession.actualStudyTime % studyTimePerCycle) / studyTimePerCycle * 100;
  
  if (!document.getElementById('stopModal')) {
    const modalHtml = `
      <div class="modal fade" id="stopModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-warning text-dark">
              <h5 class="modal-title">
                <i class="fas fa-pause me-2"></i>
                Session Paused
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="row mb-3">
                <div class="col-6">
                  <strong>Planned:</strong><br>
                  <span class="text-primary">${currentSession.studyTime} minutes</span>
                </div>
                <div class="col-6">
                  <strong>Study Time:</strong><br>
                  <span class="text-success">${actualStudyMinutes}m ${actualStudySeconds}s</span>
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-6">
                  <strong>Current Cycle:</strong><br>
                  <span class="text-info">Cycle ${displayCurrentCycle} of ${config.cycles}</span>
                  <div class="progress mt-1" style="height: 6px;">
                    <div class="progress-bar" role="progressbar" style="width: ${Math.min(cycleProgress, 100)}%" aria-valuenow="${Math.min(cycleProgress, 100)}" aria-valuemin="0" aria-valuemax="100"></div>
                  </div>
                  <small class="text-muted">${Math.floor(cycleProgress)}% cycle completion</small>
                </div>
              </div>
              <p class="mb-3"><strong>${currentSession.purpose}</strong></p>
              <div class="mb-3">
                <label class="form-label">Quick note (optional):</label>
                <textarea id="stopNotesInput" class="form-control" rows="2" placeholder="What did you accomplish so far?"></textarea>
              </div>
              <p class="text-muted small">This partial session will be saved to track your study progress.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" id="saveStopSession">
                <i class="fas fa-save me-1"></i>Save Partial Session
              </button>
              <button type="button" class="btn btn-success" id="continueSession">
                <i class="fas fa-play me-1"></i>Continue Studying
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    document.getElementById('saveStopSession').addEventListener('click', saveStopSession);
    document.getElementById('continueSession').addEventListener('click', continueSession);
  }
  
  const modal = new bootstrap.Modal(document.getElementById('stopModal'));
  modal.show();
  
  ('Pause modal shown:', {
    actualStudyTime: `${actualStudyMinutes}m ${actualStudySeconds}s`,
    currentCycle: displayCurrentCycle,
    cycleProgress: Math.floor(cycleProgress),
    totalTime: `${totalMinutes}m`
  });
}

async function saveStopSession() {
  const stopNotes = document.getElementById('stopNotesInput') ? document.getElementById('stopNotesInput').value.trim() : '';
  
  const success = await saveSessionToBackend({
    purpose: currentSession.purpose,
    studyTime: currentSession.studyTime,
    actualStudyTime: Math.floor(currentSession.actualStudyTime / 60),
    restTime: config.breakDuration,
    cycles: currentSession.cycles,
    completedCycles: currentSession.completedCycles,
    isCompleted: false,
    notes: stopNotes || notesData || undefined
  });
  
  if (success) {
    const modal = bootstrap.Modal.getInstance(document.getElementById('stopModal'));
    if (modal) modal.hide();
    performReset();
    alert('Partial session saved successfully!');
  } else {
    alert('Failed to save partial session. Check console for errors.');
  }
}

function continueSession() {
  ('Continuing session...');
  isRunning = true;
  currentSession.isStoppedManually = false;
  
  const modal = bootstrap.Modal.getInstance(document.getElementById('stopModal'));
  if (modal) modal.hide();
  
  // Hide Instagram popup if open
  hideInstagramPopup();
  
  // Restart timer from current position
  timerInterval = setInterval(() => {
    if (currentMode === 'study') {
      totalSeconds++;
      currentSession.totalElapsedSeconds++;
      currentSession.actualStudyTime++;
    } else if (currentMode === 'break') {
      breakTimeElapsed++;
    }
    
    currentBlockRemaining--;
    
    if (currentBlockRemaining <= 0) {
      if (currentMode === 'study') {
        currentSession.completedCycles++;
        
        if (currentSession.completedCycles < config.cycles) {
          currentMode = 'break';
          breakTimeElapsed = 0;
          currentBlockRemaining = config.breakDuration * 60;
          updateModeDisplay();
          showInstagramPopup();
          (`⏸️ Starting ${config.breakDuration} minute break...`);
        } else {
          stopTimer(true);
          showCompletionModal();
        }
      } else {
        hideInstagramPopup();
        currentMode = 'study';
        const nextStudyBlockSeconds = Math.floor((config.duration * 60) / config.cycles);
        const remainderForNext = (config.duration * 60) % config.cycles;
        let nextStudyBlockDuration = nextStudyBlockSeconds;
        
        if (remainderForNext > 0 && currentSession.currentCycle <= remainderForNext) {
          nextStudyBlockDuration += 1;
        }
        
        currentBlockRemaining = nextStudyBlockDuration;
        currentSession.currentCycle++;
        updateModeDisplay();
        (`▶️ Break ended, starting Cycle ${currentSession.currentCycle}: ${nextStudyBlockDuration} seconds`);
      }
    }
    
    updateDisplay();
  }, 1000);
  
  if (elements.timerContainer) elements.timerContainer.classList.add('running');
}

async function handleReset() {
  if (!currentSession || totalSeconds === 0) {
    performReset();
    return;
  }
  
  const actualStudyMinutes = Math.floor(currentSession.actualStudyTime / 60);
  
  if (actualStudyMinutes > 0) {
    const shouldSave = confirm(
      `Session Progress:\n` +
      `Planned: ${currentSession.studyTime} minutes\n` +
      `Actual Study: ${actualStudyMinutes} minutes\n` +
      `Cycles: ${currentSession.completedCycles} of ${config.cycles}\n\n` +
      `Save this partial session before resetting?`
    );
    
    if (shouldSave) {
      ('User chose to save on reset');
      const success = await saveSessionToBackend({
        purpose: currentSession.purpose,
        studyTime: currentSession.studyTime,
        actualStudyTime: actualStudyMinutes,
        restTime: config.breakDuration,
        cycles: currentSession.cycles,
        completedCycles: currentSession.completedCycles,
        isCompleted: false,
        notes: notesData || undefined
      });
      
      if (success) {
        alert('Partial session saved successfully!');
        performReset();
      } else {
        alert('Failed to save partial session. Check console for errors.');
        if (confirm('Reset without saving?')) {
          performReset();
        }
      }
    } else {
      performReset();
    }
  } else {
    performReset();
  }
}

function performReset() {
  stopTimer(false);
  exitFullscreenMode();
  totalSeconds = 0;
  breakTimeElapsed = 0;
  currentSession = null;
  currentMode = 'study';
  currentBlockRemaining = 0;
  updateDisplay();
  
  if (elements.preStartControls) elements.preStartControls.style.display = 'block';
  if (elements.preStartActionButtons) elements.preStartActionButtons.style.display = 'block';
  if (elements.sessionControls) elements.sessionControls.classList.add('d-none');
  if (elements.sessionInfo) elements.sessionInfo.classList.add('d-none');
  if (elements.fullscreenOverlay) elements.fullscreenOverlay.classList.add('d-none');
  if (document.body) document.body.classList.remove('fullscreen-active');
  if (elements.customizeDropdown) elements.customizeDropdown.style.display = 'none';
  if (elements.modeIndicator) elements.modeIndicator.classList.add('d-none');
  
  // Clean up modals
  ['stopModal', 'completionModal', 'instagramPopup'].forEach(modalId => {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) modalInstance.dispose();
      modalElement.remove();
    }
  });
}

function stopTimer(completedNaturally = false) {
  if (isRunning) {
    clearInterval(timerInterval);
    isRunning = false;
    if (elements.timerContainer) elements.timerContainer.classList.remove('running');
  }
  
  if (completedNaturally) {
    (`Session completed naturally - Study time: ${Math.floor(currentSession.actualStudyTime / 60)} min`);
  }
  
  hideInstagramPopup();
}

// Display Update Functions
function updateDisplay() {
  updateTimerDisplay();
  
  if (elements.purposeText && currentSession) {
    elements.purposeText.textContent = currentSession.purpose;
  }
  
  if (elements.cycleCounter && currentSession) {
    elements.cycleCounter.textContent = `Cycle ${currentSession.currentCycle} of ${config.cycles}`;
  }
  
  if (elements.fullscreenPurposeText && currentSession) {
    elements.fullscreenPurposeText.textContent = currentSession.purpose;
  }
  if (elements.fullscreenCycleCounter && currentSession) {
    elements.fullscreenCycleCounter.textContent = `Cycle ${currentSession.currentCycle} of ${config.cycles}`;
  }
  
  if (elements.sessionInfo && currentSession) {
    const actualStudyMinutes = Math.floor(currentSession.actualStudyTime / 60);
    const actualStudySeconds = currentSession.actualStudyTime % 60;
    
    if (elements.purposeText) {
      elements.purposeText.innerHTML = `
        <i class="fas fa-bookmark me-1"></i>
        ${currentSession.purpose} 
        <small class="text-muted">(${actualStudyMinutes}m ${actualStudySeconds}s)</small>
      `;
    }
    
    if (elements.fullscreenPurposeText) {
      elements.fullscreenPurposeText.innerHTML = `
        ${currentSession.purpose} 
        <small class="text-muted">(${actualStudyMinutes}m ${actualStudySeconds}s)</small>
      `;
    }
  }
}

// Fullscreen Functions
function enterFullscreenMode() {
  isFullscreen = true;
  if (elements.fullscreenOverlay) elements.fullscreenOverlay.classList.remove('d-none');
  if (document.body) document.body.classList.add('fullscreen-active');
  if (elements.fullscreenSessionInfo) elements.fullscreenSessionInfo.classList.remove('d-none');
}

function exitFullscreenMode() {
  isFullscreen = false;
  if (elements.fullscreenOverlay) elements.fullscreenOverlay.classList.add('d-none');
  if (document.body) document.body.classList.remove('fullscreen-active');
  if (elements.studyNotesPopup) elements.studyNotesPopup.classList.add('d-none');
  hideInstagramPopup();
}

// Notes Functions
function showStudyNotes() {
  if (elements.studyNotesPopup) elements.studyNotesPopup.classList.remove('d-none');
  if (elements.notesTextarea) {
    elements.notesTextarea.value = notesData;
    elements.notesTextarea.focus();
  }
}

function hideStudyNotes() {
  if (elements.notesTextarea) notesData = elements.notesTextarea.value;
  if (elements.studyNotesPopup) elements.studyNotesPopup.classList.add('d-none');
}

function saveStudyNotes() {
  if (elements.notesTextarea) notesData = elements.notesTextarea.value;
  hideStudyNotes();
}

let breakTimer = null;

// Request permission for browser notifications
if (Notification.permission === "default") {
  Notification.requestPermission();
}

function showInstagramPopup() {
  // Open Instagram Reels (or any site) in new tab
  instagramWindow = window.open('https://www.instagram.com/reels/', '_blank');

  // Modal in current page to tell user
  if (!document.getElementById('instagramPopup')) {
    const popupHtml = `
      <div class="modal fade" id="instagramPopup" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title">Break Time</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <p>Break started! Instagram Reels opened in a new tab.</p>
              <p class="text-muted">You’ll get a notification when the break ends.</p>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', popupHtml);
  }

  const popup = document.getElementById('instagramPopup');
  if (popup) {
    const modal = new bootstrap.Modal(popup);
    modal.show();
  }

  // Start break timer (example: config.breakDuration in minutes)
  breakTimer = setTimeout(endBreak, config.breakDuration * 60 * 1000);

  ('☕ Break started for', config.breakDuration, 'minutes');
}

function endBreak() {
  // Send browser notification
  if (Notification.permission === "granted") {
    new Notification("⏰ Break is over!", {
      body: "Time to get back to studying.",
      icon: "/icons/pomodoro.png" // optional
    });
  }

  ("⏰ Break ended. Waiting for user to return to page...");

  // Focus detection: wait for user to come back
  document.addEventListener("visibilitychange", handleVisibilityChange, { once: true });
}

function handleVisibilityChange() {
  if (document.visibilityState === "visible") {
    ("👀 User returned to page. Starting next study session...");
    startNextSession(); // <-- call your study session function here
  }
}

function hideInstagramPopup() {
  // Close Instagram tab if open
  if (instagramWindow && !instagramWindow.closed) {
    instagramWindow.close();
    instagramWindow = null;
  }
  
  // Hide modal
  const popup = document.getElementById('instagramPopup');
  if (popup) {
    const modal = bootstrap.Modal.getInstance(popup);
    if (modal) modal.hide();
  }
  ('Hiding Instagram reels popup and closing tab');
}

// Modal Functions
function showCompletionModal() {
  if (!currentSession) return;
  
  const actualStudyMinutes = Math.floor(currentSession.actualStudyTime / 60);
  const actualStudySeconds = currentSession.actualStudyTime % 60;
  
  if (elements.completionPurpose) elements.completionPurpose.textContent = currentSession.purpose;
  if (elements.completionDuration) elements.completionDuration.textContent = `${currentSession.studyTime} minutes (planned)`;
  if (elements.completionActual) {
    elements.completionActual.innerHTML = `
      ${actualStudyMinutes} minutes ${actualStudySeconds} seconds (actual study time)
      <small class="text-muted d-block">Total time including breaks: ${Math.floor(totalSeconds / 60)} minutes</small>
    `;
  }
  if (elements.completionCycles) elements.completionCycles.textContent = `${currentSession.completedCycles} of ${config.cycles} cycles completed`;
  if (elements.finalNotesInput) elements.finalNotesInput.value = notesData;
  
  if (elements.completionModal) {
    const modal = new bootstrap.Modal(elements.completionModal);
    modal.show();
  }
  
  ('Completion modal shown:', {
    planned: currentSession.studyTime,
    actualStudy: `${actualStudyMinutes}m ${actualStudySeconds}s`,
    cycles: `${currentSession.completedCycles}/${config.cycles}`,
    totalTime: Math.floor(totalSeconds / 60)
  });
}

async function saveFinalSession() {
  if (!currentSession) return;
  
  const finalNotes = elements.finalNotesInput ? elements.finalNotesInput.value.trim() : '';
  const actualStudyMinutes = Math.floor(currentSession.actualStudyTime / 60);
  
  (`Saving final session - Planned: ${currentSession.studyTime} min, Actual Study: ${actualStudyMinutes} min`);
  
  const success = await saveSessionToBackend({
    purpose: currentSession.purpose,
    studyTime: currentSession.studyTime,
    actualStudyTime: actualStudyMinutes,
    restTime: config.breakDuration,
    cycles: currentSession.cycles,
    completedCycles: currentSession.completedCycles,
    isCompleted: true,
    notes: finalNotes || notesData || undefined
  });
  
  if (success) {
    alert(`Session saved successfully! 🎉\nStudy Time: ${actualStudyMinutes} minutes`);
    if (elements.completionModal) {
      bootstrap.Modal.getInstance(elements.completionModal).hide();
    }
    performReset();
    notesData = '';
    if (elements.finalNotesInput) elements.finalNotesInput.value = '';
  } else {
    alert('Failed to save session. Check console for errors.');
  }
}

// Backend Integration Functions
async function saveSessionToBackend(sessionData) {
  ('Saving session to backend...');
  
  const pomodoroData = {
    userId: window.currentUser ? window.currentUser._id : 'anonymous',
    facebookName: window.currentUser ? window.currentUser.name : facebookName,
    purpose: sessionData.purpose,
    studyTime: sessionData.studyTime,
    actualStudyTime: sessionData.actualStudyTime,
    restTime: config.breakDuration,
    cycles: sessionData.cycles,
    completedCycles: sessionData.completedCycles,
    isCompleted: sessionData.isCompleted || false,
    notes: sessionData.notes,
    studyDate: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  
  ('Sending data to backend:', pomodoroData);
  
  try {
    const response = await fetch('/pomodoro/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pomodoroData)
    });
    
    ('Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error response:', errorData);
      throw new Error(errorData || 'Failed to save session');
    }
    
    const result = await response.json();
    ('Backend response:', result);
    return true;
  } catch (error) {
    console.error('Fetch error:', error);
    return false;
  }
}

// Utility Functions
function getCurrentSessionSummary() {
  return {
    studyTime: currentSession ? currentSession.studyTime : 0,
    actualStudyTime: currentSession ? Math.floor(currentSession.actualStudyTime / 60) : 0,
    cycles: config.cycles,
    completedCycles: currentSession ? currentSession.completedCycles : 0,
    totalTime: Math.floor(totalSeconds / 60),
    currentCycle: currentSession ? currentSession.currentCycle : 1
  };
}

// Export functions for external access (if using modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    startTimer,
    stopTimer,
    resetTimer: performReset,
    getCurrentSessionSummary,
    updateTimerStyles,
    updateTimerDisplay
  };
}