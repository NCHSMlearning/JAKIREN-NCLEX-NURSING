// ============================================
// QUIZZES MODULE - NCLEX Practice Questions
// ============================================

const nclexQuizzes = {
    1: { // Lecture 1 quiz
        question: "What is the priority nursing action for a patient with chest pain?",
        options: [
            "Administer aspirin",
            "Check vital signs",
            "Apply oxygen",
            "Notify the provider"
        ],
        answer: 2,
        explanation: "Applying oxygen is the priority to prevent hypoxia and myocardial damage."
    },
    2: {
        question: "Which finding indicates effective CPR?",
        options: [
            "Pupils dilated",
            "Return of spontaneous circulation",
            "Cyanosis improvement",
            "Patient groaning"
        ],
        answer: 1,
        explanation: "Return of spontaneous circulation (ROSC) indicates effective CPR."
    }
};

async function renderQuiz(lectureId) {
    const quiz = nclexQuizzes[lectureId];
    if (!quiz) return '';
    
    return `
        <div class="quiz-section">
            <h3><i class="fas fa-question-circle"></i> NCLEX Practice Question</h3>
            <p style="margin: 16px 0; font-weight: 500;">${quiz.question}</p>
            <div id="quizOptions">
                ${quiz.options.map((opt, i) => `
                    <label class="quiz-option">
                        <input type="radio" name="quiz" value="${i}">
                        <span>${opt}</span>
                    </label>
                `).join('')}
            </div>
            <button class="btn btn-primary" onclick="checkQuizAnswer(${lectureId})">
                <i class="fas fa-check"></i> Check Answer
            </button>
            <div id="quizFeedback" style="margin-top: 16px;"></div>
        </div>
    `;
}

window.checkQuizAnswer = async function(lectureId) {
    const quiz = nclexQuizzes[lectureId];
    if (!quiz) return;
    
    const selected = document.querySelector('input[name="quiz"]:checked');
    if (!selected) {
        showToast('Please select an answer', true);
        return;
    }
    
    const feedbackDiv = document.getElementById('quizFeedback');
    if (parseInt(selected.value) === quiz.answer) {
        feedbackDiv.innerHTML = `
            <div style="background: var(--success); color: white; padding: 12px; border-radius: 12px;">
                <i class="fas fa-check-circle"></i> ✅ Correct! ${quiz.explanation}
            </div>
        `;
        // Award points or track progress
        await recordQuizPass(lectureId);
    } else {
        const correctAnswer = quiz.options[quiz.answer];
        feedbackDiv.innerHTML = `
            <div style="background: var(--danger); color: white; padding: 12px; border-radius: 12px;">
                <i class="fas fa-times-circle"></i> ❌ Incorrect. The correct answer is: ${correctAnswer}<br>
                <small>${quiz.explanation}</small>
            </div>
        `;
    }
};

async function recordQuizPass(lectureId) {
    const user = await getCurrentUser();
    if (!user) return;
    
    const quizKey = `quiz_passed_${lectureId}_${user.id}`;
    if (!localStorage.getItem(quizKey)) {
        localStorage.setItem(quizKey, 'true');
        showToast('🎉 +10 points! Keep up the great work!');
        
        // Update quiz score
        let quizScore = parseInt(localStorage.getItem(`quiz_score_${user.id}`) || '0');
        quizScore += 10;
        localStorage.setItem(`quiz_score_${user.id}`, quizScore.toString());
    }
}

// Add quiz to video modal
// Update the watchLecture function to include quiz
