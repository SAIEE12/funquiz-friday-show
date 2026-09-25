# Fun Friday Quiz Show

Build a fun, animated office quiz web app called **“Meelo Evaru Winner – Fun Friday Edition”**, inspired by the Indian TV quiz-show format, but with our own branding and office-friendly humour.

### Game

* 15 questions with prize ladder: ₹1, ₹1.5, ₹2, ₹5, ₹7, ₹10, ₹15, ₹20, ₹25, ₹30, ₹45, ₹50, ₹75, ₹90, ₹100.
* Hot-seat player answers one question at a time.
* 4 options per question.
* Timer, animated answer locking, correct/wrong animations, prize ladder and confetti.
* Make the UI feel like a professional Indian game show with funny office-themed messages.
* No “Change Question” lifeline.

### Lifelines

1. **📞 Dial-a-Dosth** – There are two configurable teams. The player selects one team and then one team member from that team. Team names and members must be editable from Setup.
2. **👥 Audience Poll – HR Edition** – Audience members open a separate `/poll` URL on their phones, enter their name and vote for A/B/C/D. Votes must update live on the Hot Seat screen and show percentages/majority answer. The poll only gives guidance; the player still chooses and locks the final answer.
3. **✂️ 50-50** – Remove two incorrect options.

### Setup

Create a simple Admin/Setup screen where I can configure:

* Hot-seat player name
* Team 1 name + members
* Team 2 name + members
* Audience/poll settings

Do not hard-code team members.

### Questions

Keep questions completely separate from application code in:
`data/questions.json`

Support these question types:

* `text`
* `image`
* `audio`

Store question images/audio under a separate public questions folder. I should be able to replace/add questions and media without changing application code.

Example question structure:
`id, type, prize, question, media, options(A/B/C/D), answer`

### Screens

Create:

* Home/Welcome
* Admin Setup
* Hot Seat Game
* Host Control Panel
* Audience `/poll`

The Host panel should control question progression, answer reveal, timers and lifelines.

The correct answer must NEVER be exposed to the player/audience before the host reveals it.

### Real-time

Use WebSockets or another simple real-time mechanism so audience votes immediately appear on the Hot Seat/Host screen.

Generate a QR code/link for the Audience Poll page so HR can easily join using their phones.

### Humour

Keep the humour suitable for an office Fun Friday. Examples:

* 50-50: “Two options have been removed due to performance issues.”
* Dial-a-Dosth: “Choose someone who actually knows the answer.”
* Audience Poll: “HR has spoken… probably.”
* Wrong answer: “That went better than a Friday evening production deployment. 😂”

Keep the code simple and maintainable because this is an MVP for an office event.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/193ce5a4-c0f3-4a8f-902b-97df046db408).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
