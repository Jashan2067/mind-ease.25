
window.onload = function () {
    const form = document.getElementById("surveyForm");
    form.reset();
};

document.getElementById("surveyForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const form = e.target;
    const questions = ["q1", "q2", "q3", "q4", "q5"];
    let totalScore = 0;
    let answeredAll = true;

    questions.forEach(q => {
        const selected = form[q].value;
        if (selected === undefined || selected === "") {
            answeredAll = false;
        } else {
            totalScore += parseInt(selected);
        }
    });

    if (!answeredAll) {
        alert("Please answer all required questions before submitting.");
        return;
    }

    const resultBox = document.getElementById("resultBox");
    const scoreDisplay = document.getElementById("scoreDisplay");
    const scoreMessage = document.getElementById("scoreMessage");

    let message = "";
    let rating = "";

    if (totalScore <= 3) {
        rating = "Good";
        message = "You appear to be feeling emotionally burdened. Please take gentle care of yourself and consider reaching out for support.";
    } else if (totalScore <= 7) {
        rating = "Very Good";
        message = "You might be carrying moderate stress or worry about your past or future. Consider journaling or talking with someone you trust.";
    } else if (totalScore <= 10) {
        rating = "Excellent";
        message = "You seem emotionally balanced and in tune with your feelings. Keep nurturing this awareness!";
    } else {
        rating = "Good";
        message = "You seem emotionally unbalanced, with good awareness of your feelings.";
    }

    scoreDisplay.textContent = `Your Reflection Rating: ${rating}`;
    scoreMessage.textContent = message;

    form.classList.add("hidden");
    resultBox.classList.remove("hidden");
});

document.getElementById("retryBtn").addEventListener("click", () => {
    const form = document.getElementById("surveyForm");
    form.reset();
    form.classList.remove("hidden");
    document.getElementById("resultBox").classList.add("hidden");
});