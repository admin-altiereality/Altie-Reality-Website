/**
 * People, capabilities and open roles.
 *
 * Team members, qualifications and role titles are transcribed from the
 * existing site. Capability descriptions restate technology the current site
 * already claims — nothing new is asserted here.
 */

const team = [
  {
    name: "Gaurav Purbia",
    role: "Founder & CEO",
    credential: "B.Tech, Electrical Engineering — UTD Kota",
  },
  {
    name: "Devendra Sharma",
    role: "Chief Business Development Officer",
    credential: "Ex-Sergeant, Indian Air Force",
  },
];

// Capabilities the current site already describes across its product pages.
const capabilities = [
  {
    key: "xr",
    label: "Extended Reality",
    title: "AR, VR and Mixed Reality",
    body:
      "Head-mounted and handheld immersive applications built for Meta Quest, Android and Cardboard VR — the delivery targets our products already ship to.",
  },
  {
    key: "ai",
    label: "Applied AI",
    title: "AI-assisted learning",
    body:
      "LearnXR pairs XR with AI to deliver self-paced, curriculum-aligned learning paths rather than fixed linear lessons.",
  },
  {
    key: "3d",
    label: "Real-time 3D",
    title: "Interactive 3D content",
    body:
      "Interactive 3D models, simulations and virtual environments — from science labs and geometry to historical reconstruction.",
  },
  {
    key: "hardware",
    label: "Hardware",
    title: "XR interaction hardware",
    body:
      "Handheld 6DoF input with buttons, sensors, haptic feedback and gesture recognition, developed under a NIDHI PRAYAS grant from the Department of Science and Technology.",
  },
  {
    key: "multiuser",
    label: "Multi-user",
    title: "Shared virtual spaces",
    body:
      "Multi-user virtual classrooms and collaborative environments where participants share one space regardless of physical location.",
  },
  {
    key: "platform",
    label: "Platform",
    title: "Cross-platform delivery",
    body:
      "Built with Flutter and Firebase to deliver consistent experiences across mobile, tablet and web alongside the headset builds.",
  },
];





// Open roles, preserved from /career. All apply through the existing form.
const roles = [
  {
    title: "Unity Developer",
    type: "Internship",
    body:
      "Code, create and contribute to production XR projects across our product line and studio work.",
  },
  {
    title: "Flutter Developer",
    type: "Internship",
    body:
      "Cross-platform app development with expertise in the Dart programming language.",
  },
  {
    title: "Blender / 3D Artist",
    type: "Internship",
    body:
      "Model, texture and optimise the 3D content that our immersive environments are built from.",
  },
  {
    title: "Business Developer",
    type: "Internship",
    body:
      "Build strategic skills and contribute directly to how our products reach schools and enterprises.",
  },
  {
    title: "Sales",
    type: "Internship",
    body:
      "Hone commercial skills and make a measurable impact on our growth trajectory.",
  },
];

// Preserved verbatim from the existing homepage testimonials section.
const testimonials = [
  {
    quote:
      "LearnXR is amazing! I went from zero XR knowledge to building my first AR app in just a few weeks. The hands-on projects really helped me understand the concepts. Plus, the community is super supportive!",
    name: "Rajesh Kumar",
    role: "Government School Teacher",
    image: "/media/assets/img/testimonials/testimonials-1.webp",
  },
  {
    quote:
      "I love how LearnXR breaks down complex XR concepts into bite-sized lessons. The interactive tutorials are fun and engaging. I'm now confidently developing VR experiences for my clients.",
    name: "Vipul Joshi",
    role: "Freelance Developer",
    image: "/media/assets/img/testimonials/testimonials-2.webp",
  },
  {
    quote:
      "As a teacher, I was looking for ways to make learning more immersive. LearnXR taught me how to create educational AR experiences. My students are now super excited about learning!",
    name: "PK Mathur",
    role: "High School Teacher",
    image: "/media/assets/img/testimonials/testimonials-3.webp",
  },
  {
    quote:
      "The XR industry is booming and LearnXR helped me pivot my career into it. The course content is always up-to-date with the latest tech. I landed my dream job in XR development thanks to the skills I learned here!",
    name: "Navin Jain",
    role: "XR Developer",
    image: "/media/assets/img/testimonials/testimonials-4.webp",
  },
];

module.exports = {
  team,
  capabilities,
  roles,
  testimonials,
};
