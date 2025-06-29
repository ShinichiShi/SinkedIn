import React from "react";
import { Button } from "@/components/ui/button";

const StoryPage = () => {
  const devComments = [
    { name: "Supreeth", comment: "We walked on a path that no one had ever walked on before... will anyone ever walk on it? 🗿", avatar: "/path/to/avatar1.jpg" },
   
    { name: "Ayush", comment: "No comments (he's sleeping probably so he didnt send me anything)", avatar: "/path/to/avatar3.jpg" },
    { name: "Rudraksha", comment: "Sex-sux karo itna nahi sochte.", avatar: "/path/to/avatar3.jpg" },
  ];

  return (
    <div className="min-h-screen bg-background text-primary">

      <section className="py-20 px-8 text-base">
        <h2 className="text-2xl font-semibold mb-6 text-center">The SinkedIn Story</h2>
        <p className="max-w-4xl mx-auto leading-8">
        The idea for Sinkedin came from one of our seniors during a casual brainstorming session. They pitched it to us juniors, and while we found it intriguing, we mostly laughed it off.
        </p>
        <p className="max-w-4xl mx-auto leading-8">
        Fast forward to a hackathon at our college—a decently big one. With nothing better in mind, we decided to bring the idea to life. After a whirlwind of coding, debugging, and debating over every little feature, we managed to piece together a prototype. Our seniors, the very ones who suggested the idea, seemed genuinely impressed at first. Their appreciation gave us hope—and maybe a little pride too.
        </p>
        <p className="max-w-4xl mx-auto leading-8">
        But then came the judging round. And guess who was on the panel? Yup, the same seniors. Suddenly, the prototype they were hyping up wasn’t looking so great to them anymore. A few non-functional buttons here, a couple of unpolished features there, and the verdict was in: “Not good enough.” They tore it apart like we had personally offended them. The parts that did work? Completely ignored. It felt like the ultimate betrayal—like watching your ship sink while the captain casually walks away.
        </p>
        <p className="max-w-4xl mx-auto leading-8">
        Defeated but not entirely sunk, one of us posted about the experience on LinkedIn. And to our surprise, it took off! Strangers from all over showed love and support for the idea. It turned out that people actually liked the concept of embracing failures.
        </p>
        <p className="max-w-4xl mx-auto leading-8">
        And that’s how Sinkedin was born—from a laughable pitch to a rejected project to a platform that celebrates failure in all its glory. Because sometimes, sinking isn’t the end—it’s just the start of the story.
        </p>

      </section>

      <section className="bg-background py-16 px-8">
        <h2 className="text-2xl font-semibold mb-10 text-center">What Our Developers Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {devComments.map((dev, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center bg-card border border-border shadow-lg rounded-xl p-8 transition-transform hover:scale-105 hover:shadow-2xl"
            >
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground mb-4 shadow">
                {dev.name[0]}
              </div>
              <h3 className="font-semibold text-lg text-primary mb-2">{dev.name}</h3>
              <p className="text-muted-foreground italic">"{dev.comment}"</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default StoryPage;
