// ============================================
// SUPPORT MODULE - Help & Contact
// ============================================

// Render support view
async function renderSupportView() {
    console.log('🎧 Rendering support view...');
    
    const contentDiv = document.getElementById('dynamicContent');
    if (!contentDiv) return;
    
    contentDiv.innerHTML = `
        <div style="background: white; border-radius: 24px; padding: 32px; margin-bottom: 24px; text-align: center;">
            <i class="fas fa-headset" style="font-size: 64px; color: var(--primary); margin-bottom: 16px;"></i>
            <h2>Support Center</h2>
            <p style="color: var(--gray);">We're here to help you succeed in your NCLEX journey</p>
        </div>
        
        <div class="stats-grid" style="margin-bottom: 24px;">
            <div class="stat-card" onclick="showContactForm('email')" style="cursor: pointer;">
                <i class="fas fa-envelope" style="font-size: 32px; color: var(--primary);"></i>
                <div class="stat-label">Email Support</div>
                <small>support@jakiren.com</small>
            </div>
            <div class="stat-card" onclick="showContactForm('whatsapp')" style="cursor: pointer;">
                <i class="fab fa-whatsapp" style="font-size: 32px; color: #25D366;"></i>
                <div class="stat-label">WhatsApp</div>
                <small>+254 700 000 000</small>
            </div>
            <div class="stat-card" onclick="showContactForm('phone')" style="cursor: pointer;">
                <i class="fas fa-phone" style="font-size: 32px; color: var(--primary);"></i>
                <div class="stat-label">Call Us</div>
                <small>+254 700 000 000</small>
            </div>
        </div>
        
        <div style="background: white; border-radius: 24px; padding: 28px; margin-bottom: 24px;">
            <h3><i class="fas fa-question-circle"></i> Frequently Asked Questions</h3>
            <div style="margin-top: 20px;">
                ${faqs.map((faq, index) => `
                    <div style="border-bottom: 1px solid var(--light-gray); padding: 16px 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="toggleFAQ(${index})">
                            <strong><i class="fas fa-question-circle" style="color: var(--primary); margin-right: 10px;"></i> ${faq.question}</strong>
                            <i class="fas fa-chevron-down" id="faqIcon${index}" style="transition: transform 0.3s;"></i>
                        </div>
                        <div id="faqAnswer${index}" style="display: none; padding-top: 12px; color: var(--gray);">
                            ${faq.answer}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div style="background: white; border-radius: 24px; padding: 28px;">
            <h3><i class="fas fa-paper-plane"></i> Send Us a Message</h3>
            <div id="contactForm" style="margin-top: 20px;">
                <input type="text" id="contactName" class="auth-input" placeholder="Your Name" value="${window.currentUser?.user_metadata?.full_name || ''}">
                <input type="email" id="contactEmail" class="auth-input" placeholder="Your Email" value="${window.currentUser?.email || ''}">
                <select id="contactSubject" class="auth-input">
                    <option value="general">General Inquiry</option>
                    <option value="payment">Payment Issue</option>
                    <option value="access">Lecture Access</option>
                    <option value="technical">Technical Support</option>
                    <option value="certificate">Certificate Request</option>
                </select>
                <textarea id="contactMessage" class="auth-input" rows="4" placeholder="Your message..."></textarea>
                <button class="btn btn-primary" onclick="submitSupportTicket()" style="width: 100%;">
                    <i class="fas fa-paper-plane"></i> Send Message
                </button>
            </div>
        </div>
    `;
}

// FAQ Data
const faqs = [
    { question: "How do I access purchased lectures?", answer: "After purchase, lectures are automatically unlocked. Click 'My Lectures' in the sidebar and you'll see all unlocked lectures with a green badge." },
    { question: "How long do I have access to lectures?", answer: "Lifetime access! Once you purchase a lecture or bundle, you have unlimited access forever." },
    { question: "What payment methods are accepted?", answer: "We accept M-Pesa (STK Push), Credit/Debit Cards, and PayPal. All payments are secure and encrypted." },
    { question: "Can I get a refund?", answer: "We offer a 7-day money-back guarantee for bundle purchases. Individual lectures are non-refundable once accessed." },
    { question: "How do I get my certificate?", answer: "Complete all 180 lectures to unlock the NCLEX Master Certificate. You can download it from the Certificates tab." },
    { question: "What if I have technical issues?", answer: "Contact our support team via email or WhatsApp. We typically respond within 24 hours." }
];

// Toggle FAQ answer
function toggleFAQ(index) {
    const answer = document.getElementById(`faqAnswer${index}`);
    const icon = document.getElementById(`faqIcon${index}`);
    if (answer.style.display === 'none') {
        answer.style.display = 'block';
        icon.style.transform = 'rotate(180deg)';
    } else {
        answer.style.display = 'none';
        icon.style.transform = 'rotate(0deg)';
    }
}

// Show contact form with pre-filled method
function showContactForm(method) {
    const subject = document.getElementById('contactSubject');
    if (subject) {
        if (method === 'email') subject.value = 'general';
        else if (method === 'whatsapp') subject.value = 'general';
        else if (method === 'phone') subject.value = 'technical';
    }
    document.getElementById('contactForm')?.scrollIntoView({ behavior: 'smooth' });
}

// Submit support ticket
async function submitSupportTicket() {
    const name = document.getElementById('contactName')?.value;
    const email = document.getElementById('contactEmail')?.value;
    const subject = document.getElementById('contactSubject')?.value;
    const message = document.getElementById('contactMessage')?.value;
    
    if (!name || !email || !message) {
        if (window.showToast) showToast('Please fill all fields', 'error');
        return;
    }
    
    // Here you would typically save to Supabase
    console.log('Support ticket:', { name, email, subject, message });
    
    if (window.showToast) {
        showToast('Message sent! We\'ll respond within 24 hours.', 'success');
    }
    
    // Clear form
    const messageField = document.getElementById('contactMessage');
    if (messageField) messageField.value = '';
}

// Expose to global window
window.renderSupportView = renderSupportView;
window.toggleFAQ = toggleFAQ;
window.showContactForm = showContactForm;
window.submitSupportTicket = submitSupportTicket;

console.log('✅ Support module loaded');
