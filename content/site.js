/**
 * Single source of truth for Altie Reality's factual content.
 *
 * Every value here is transcribed from the existing production website.
 * Nothing in this file may be invented: no metrics, customers, funding
 * figures, partners or claims that the previous site did not already make.
 */

const company = {
  legalName: "Altie Reality Private Limited",
  brandName: "Altie Reality",
  tagline: "A Metaverse Company",
  domain: "https://www.altiereality.com",
  // Verbatim from the existing site footer.
  boilerplate:
    "Altie Reality Private Limited is a pioneering Metaverse firm offering AR/VR as a Service across Gaming, Real Estate, Education, Tourism, and Entertainment. Recognized by FITT IIT Delhi, Meta, iHub Drishti IIT Jodhpur, SPTBI Mumbai and iStart Rajasthan, we deliver innovative, immersive, and affordable solutions to transform industries and redefine experiences.",
  address: {
    line1: "41, 42 Bhamashah Technohub",
    line2: "Sansthan Path",
    city: "Jaipur",
    region: "Rajasthan",
    postalCode: "302007",
    country: "India",
    countryCode: "IN",
    maps:
      "https://www.google.com/maps/search/Altie+Reality+Private+Limited/@26.9115852,75.7960379,17z",
    latitude: "26.9115852",
    longitude: "75.7960379",
  },
  email: "info.altiereality@gmail.com",
  emailAlt: "admin@altiereality.com",
  phone: "+91 8619953434",
  phoneAlt: "+91 9145822691",
  whatsapp:
    "https://wa.me/918619953434?text=Hi%20Altie%20Reality%2C%20I%20would%20like%20to%20know%20more%20about%20your%20services",
  hours: "Monday – Friday, 9:00 AM – 5:00 PM IST",
  calendly: "https://calendly.com/info-altiereality/altie-reality-1-1-2",
  careersForm: "https://forms.gle/6Nym8X5jWMjdd7Pu5",
  founded: "2021",
  logo: "/media/assets/img/logo.webp",
};

// Preserved exactly as they appear on the current site.
const social = [
  {
    name: "LinkedIn",
    url: "https://in.linkedin.com/company/altie-reality",
    icon: "linkedin",
  },
  {
    name: "YouTube",
    url: "https://www.youtube.com/channel/UCXhsQN9jsazg4FDoIuSseBg",
    icon: "youtube",
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/learn__xr",
    icon: "instagram",
  },
  {
    name: "Facebook",
    url: "https://www.facebook.com/altiereality",
    icon: "facebook",
  },
];

const products = [
  {
    slug: "learnxr",
    name: "LearnXR™",
    href: "/products/learnxr",
    external: "https://learnxr.altiereality.com",
    category: "Flagship platform",
    summary: "XR + AI learning platform for schools and colleges.",
    blurb:
      "Curriculum-aligned immersive lessons delivered on Meta Quest, Android and Cardboard VR, with teacher tooling and learning analytics behind them.",
    // Real screenshots of the shipped Android app.
    image: "/media/assets/img/portfolio/portfolio-1.webp",
    imageFit: "contain",
    shots: [
      {
        src: "/media/assets/img/portfolio/portfolio-1.webp",
        alt: "LearnXR app home screen listing free lessons and video XR lessons",
        caption: "Lesson library",
      },
      {
        src: "/media/assets/img/portfolio/portfolio-2.webp",
        alt: "LearnXR lesson detail screen for Curiosity on Mars",
        caption: "Lesson detail",
      },
      {
        src: "/media/assets/img/portfolio/portfolio-3.webp",
        alt: "LearnXR immersive scene with a Cardboard VR toggle",
        caption: "Immersive scene",
      },
    ],
    links: [
      {
        label: "Meta Quest Store",
        url: "https://www.meta.com/experiences/8125807630791042/",
      },
      {
        label: "Google Play",
        url:
          "https://play.google.com/store/apps/details?id=com.altiereality1.lexrn&hl=en_IN",
      },
      { label: "learnxr.altiereality.com", url: "https://learnxr.altiereality.com" },
    ],
  },
  {
    slug: "xrtouch",
    name: "XRtouch",
    href: "/XRtouch",
    category: "Hardware",
    summary: "A 6DoF handheld controller for XR content.",
    blurb:
      "A wireless, ergonomic accessory that pairs with a head-mounted display to navigate virtual and augmented environments through buttons, sensors and haptic feedback.",
    image: "/media/images/hardware.webp",
    links: [],
  },
  {
    slug: "reliconnect",
    name: "ReliconnectVR™",
    href: "/products/reliconnect",
    external:
      "https://play.google.com/store/apps/details?id=com.altiereality.reliconnect",
    category: "Consumer application",
    summary: "Immersive religious and cultural experiences in VR.",
    blurb:
      "An Android VR application bringing places of worship and cultural sites to audiences who cannot travel to them.",
    image: null,
    links: [
      {
        label: "Google Play",
        url:
          "https://play.google.com/store/apps/details?id=com.altiereality.reliconnect",
      },
    ],
  },
  {
    slug: "metamatch",
    name: "MetaMatch",
    href: "/products/metamatch",
    external: "https://metamatch.altiereality.com",
    category: "Social platform",
    summary: "Social connection built for shared virtual spaces.",
    blurb:
      "A social experience designed around presence — people meeting, and spending time together, inside a shared virtual environment.",
    image: null,
    links: [
      { label: "metamatch.altiereality.com", url: "https://metamatch.altiereality.com" },
    ],
  },
  {
    slug: "altie-studios",
    name: "Altie Studios",
    href: "/gaming",
    category: "Studio",
    summary: "Immersive game and simulation development.",
    blurb:
      "Our interactive studio practice: gamified corporate training, simulation and XR entertainment built on the same engine stack as our products.",
    image: "/media/images/game.webp",
    links: [],
  },
];

// Every vertical the existing site publishes, with its copy preserved.
const industries = [
  {
    slug: "education",
    route: "/education",
    eyebrow: "Education",
    name: "Education",
    title: "Mixed Reality Solutions for Schools & Colleges",
    lead:
      "Embarking on a transformative journey in education, Mixed Reality (MR) solutions are revolutionizing the traditional classroom experience for schools and colleges. Our comprehensive MR solutions seamlessly integrate the physical and digital worlds, creating immersive learning environments. Students are no longer confined to textbooks; instead, they engage with holographic educational content that brings lessons to life. From interactive 3D models for science classes to historical reenactments in social studies, MR fosters experiential learning, captivating students' attention and deepening their understanding of complex subjects. Additionally, virtual field trips and collaborative projects become a reality, transcending geographical boundaries and enhancing global connectivity.",
    image: "/media/images/education%202.webp",
    imageAlt: "Students using immersive learning technology in a classroom",
    useCases: [
      "Engage students with holographic content",
      "Bring lessons to life with interactive experiences",
      "Deepen understanding through immersive content",
      "Enable students to explore virtual environments",
      "Overcome geographical limitations for diverse experiences",
      "Transport students to historical events through MR",
    ],
    benefits: [
      {
        title: "Experiential learning",
        body:
          "MR enables experiential learning by simulating real-world scenarios. Students can virtually visit historical sites, conduct science experiments, or explore ecosystems, providing a hands-on learning experience that may not be feasible in a traditional classroom setting.",
      },
      {
        title: "Collaboration at distance",
        body:
          "MR facilitates collaborative learning experiences. Students can work together in a shared virtual space, regardless of their physical locations, fostering teamwork and communication skills.",
      },
      {
        title: "Comprehension of hard concepts",
        body:
          "MR offers a more immersive and engaging learning environment. Students can interact with 3D models, simulations, and virtual environments, making complex concepts more accessible and interesting.",
      },
    ],
    relatedProduct: "learnxr",
  },
  {
    slug: "medical",
    route: "/medical",
    eyebrow: "Healthcare",
    name: "Medical",
    title: "Virtual, Augmented and Mixed Reality solutions for Healthcare",
    lead:
      "In the ever-evolving landscape of healthcare, the integration of Virtual Reality (VR), Augmented Reality (AR), and Mixed Reality (MR) solutions is revolutionizing patient care, medical training, and diagnostics. Virtual Reality immerses patients in therapeutic environments, reducing stress and anxiety during treatments. Augmented Reality enhances surgeons' precision with holographic overlays during procedures, offering real-time data and improving surgical outcomes. Mixed Reality seamlessly merges physical and digital worlds, facilitating collaborative medical simulations and training for healthcare professionals.",
    image: "/media/images/medicala%202.webp",
    imageAlt: "Mixed reality visualisation applied to healthcare",
    useCases: [
      "Immersive environments for stress reduction during treatments",
      "Enhanced patient comfort and mental well-being",
      "Holographic overlays aiding surgeons in precision",
      "Real-time data visualization for improved surgical outcomes",
      "Enhancing communication and decision-making among medical teams",
      "Augmented reality for remote consultations",
      "Enabling healthcare professionals to provide virtual guidance and support",
    ],
    benefits: [
      {
        title: "Surgical planning",
        body:
          "MR allows surgeons to visualize patient anatomy in three dimensions before performing surgery. This helps in planning and practicing complex procedures, improving surgical precision and reducing risks.",
      },
      {
        title: "Medical education",
        body:
          "MR is used for medical education and training. Medical students and healthcare professionals can engage in realistic simulations, practicing surgeries or diagnostic procedures in a virtual environment before working with real patients.",
      },
      {
        title: "Patient understanding",
        body:
          "MR can be used to educate patients about their medical conditions. Visualizing 3D models of organs or medical procedures in an interactive way helps patients better understand their diagnoses and treatment options.",
      },
    ],
  },
  {
    slug: "defence",
    route: "/defence",
    eyebrow: "Defence",
    name: "Defence",
    title: "Mixed Reality in Defence",
    lead:
      "In the realm of defence, Mixed Reality (MR) stands as a transformative force, seamlessly merging the physical and virtual worlds to enhance military capabilities and strategic operations. MR enables defence professionals to visualize complex data, tactical scenarios, and critical information overlaid onto the real world, providing unparalleled situational awareness. From training simulations that immerse soldiers in realistic battlefield environments to holographic displays aiding in mission planning, MR technologies empower defence forces to make informed decisions swiftly and effectively.",
    image: "/media/images/defence%202.webp",
    imageAlt: "Mixed reality applied to defence training and mission planning",
    useCases: [
      "Conduct realistic training scenarios in mixed reality",
      "Enable military personnel to interact with and manipulate digital information in real-time",
      "Create a dynamic environment for collaborative decision-making",
      "Enhance visualization and collaboration in strategic decision-making",
      "Utilize holographic displays for dynamic mission planning",
      "Prepare soldiers for diverse battlefield environments",
    ],
    benefits: [
      {
        title: "Training and simulation",
        body:
          "MR can be utilized for realistic military training scenarios. Soldiers can engage in immersive simulations that replicate various combat situations, providing them with hands-on experience in a safe and controlled environment. This can enhance decision-making skills, tactical awareness, and overall preparedness.",
      },
      {
        title: "Maintenance and repair",
        body:
          "Mixed Reality can be applied to maintenance and repair tasks for military equipment. Technicians can use MR to overlay digital information, such as manuals or schematics, onto real-world equipment, facilitating faster and more accurate repairs.",
      },
      {
        title: "Distributed collaboration",
        body:
          "MR can improve communication and collaboration among military personnel. Soldiers in different locations can share a common augmented reality workspace, enabling them to view and interact with shared information in real-time.",
      },
      {
        title: "Logistics and analysis",
        body:
          "MR can be used in logistics and supply chain operations to optimize inventory management, transportation, and distribution, and to visualise complex data sets related to cyber threats and vulnerabilities.",
      },
    ],
  },
  {
    slug: "architecture",
    route: "/architecture",
    eyebrow: "Real Estate & Architecture",
    name: "Real Estate",
    title: "AR & VR Solutions for Interior Design & Architecture",
    lead:
      "In the dynamic realm of interior design and architecture, Augmented Reality (AR) and Virtual Reality (VR) solutions are reshaping the creative process. Augmented Reality brings design concepts to life by overlaying virtual elements onto real-world spaces, allowing clients to visualize and interact with proposed designs in their own environments. Virtual Reality immerses architects and designers in three-dimensional virtual spaces, offering a realistic sense of scale, proportion, and ambiance — from virtual walkthroughs of unbuilt structures to interactive AR catalogs for furniture placement.",
    image: "/media/images/architectue.webp",
    imageAlt: "Architectural visualisation in virtual reality",
    useCases: [
      "Overlay virtual design elements onto real spaces",
      "Enable clients to visualize and interact with proposed designs",
      "Immerse architects and designers in three-dimensional virtual spaces",
      "Provide a realistic sense of scale, proportion, and ambiance",
      "Use AR to place virtual furniture in real-world spaces",
      "Aid clients in visualizing potential layouts and arrangements",
      "Augmented reality catalogs for furniture and decor",
    ],
    benefits: [
      {
        title: "Design at human scale",
        body:
          "Architects can use MR to visualize their designs in three dimensions at a human scale. This allows for a more immersive understanding of spatial relationships, proportions, and design elements, helping architects and clients make more informed decisions.",
      },
      {
        title: "Real-time collaboration",
        body:
          "MR facilitates collaborative design processes by enabling architects and stakeholders to share and interact with 3D models in real-time. Multiple participants, regardless of their physical location, can engage in virtual meetings to discuss and modify designs together.",
      },
      {
        title: "Site planning",
        body:
          "MR technology can assist architects in analyzing and planning construction sites. By overlaying digital information onto the physical environment, architects can assess how a proposed structure fits into the existing landscape.",
      },
      {
        title: "Client presentation",
        body:
          "Instead of traditional 2D drawings or static 3D models, architects can showcase designs in a more dynamic and interactive manner, enhancing client engagement and understanding — including public engagement on large-scale projects.",
      },
    ],
  },
  {
    slug: "automotive",
    route: "/automotive",
    eyebrow: "Automotive",
    name: "Automotive",
    title: "Metaverse Solutions for the Automotive Industry",
    lead:
      "Altie Reality reshapes the automotive industry through metaverse solutions. Our virtual showrooms redefine the car-buying experience, allowing customers to explore models from anywhere. Digital prototyping accelerates innovation, bringing designs to life in a collaborative virtual environment. Immersive training simulations equip the workforce with hands-on experience, while virtual test drives and experiential marketing redefine customer engagement.",
    image: "/media/images/automotive%202.webp",
    imageAlt: "Virtual automotive showroom and digital prototyping",
    useCases: [
      "Remote exploration of car models",
      "Showcase customization options",
      "Thrilling virtual test drive experiences",
      "Experiential marketing campaigns in the metaverse",
      "Reduce downtime with remote guidance",
      "Visualize and optimize component movement",
      "Real-time AR navigation for drivers",
      "AR/IoT based production plant visualization",
    ],
    benefits: [
      {
        title: "Design and prototyping",
        body:
          "Automotive designers can use MR to visualize and interact with 3D models of vehicles during the design and prototyping phases. This allows for a more immersive and accurate assessment of the design, streamlining the development process.",
      },
      {
        title: "Virtual testing",
        body:
          "MR enables engineers to conduct virtual prototyping and testing of automotive components and systems. This helps in identifying potential issues early in the design phase, reducing the need for physical prototypes and saving both time and resources.",
      },
      {
        title: "Technician training",
        body:
          "MR can be used for training automotive technicians in vehicle maintenance and repair. Technicians can access virtual overlays of vehicle components, providing step-by-step guidance for repairs and diagnostics.",
      },
    ],
  },
  {
    slug: "gaming",
    route: "/gaming",
    eyebrow: "Gaming & Enterprise Training",
    name: "Gaming",
    title: "Interactive Corporate Training With Immersive Technology",
    lead:
      "Interactive corporate training programs powered by immersive technologies such as Virtual Reality and Augmented Reality have proven exceptionally effective at engaging employees. These technologies transport trainees into realistic scenarios, providing hands-on experience without real-world consequences. In VR, employees can simulate challenging situations, from high-pressure client meetings to emergency response drills, honing their skills in a safe and controlled environment. Gamification is not limited to entertainment — it can be leveraged to raise engagement in industrial training, something classroom teaching has always struggled with.",
    image: "/media/images/game.webp",
    imageAlt: "Immersive gaming and simulation experience",
    useCases: [
      "Simulate real-world scenarios for practical skill development",
      "Provide employees with a safe and controlled environment to practice complex tasks",
      "Enable employees to interact with virtual environments and objects",
      "Facilitate experiential learning that enhances retention and application of knowledge",
      "Improve skills at sports by using AI based challenges",
    ],
    benefits: [
      {
        title: "Blended interaction",
        body:
          "MR can provide a more immersive experience by blending virtual and real-world elements. This allows players to interact with virtual objects and environments in a more natural and engaging way.",
      },
      {
        title: "Spatial mapping",
        body:
          "Spatial mapping and tracking technologies allow players to move and interact with virtual content in a physical space. This enhances spatial awareness and contributes to a more realistic and intuitive experience.",
      },
      {
        title: "Shared presence",
        body:
          "MR can facilitate social interaction. Players can see and interact with each other's virtual avatars, fostering a sense of presence and connection, even if they are physically in different locations.",
      },
      {
        title: "Simulation and training",
        body:
          "Mixed Reality can be used for simulation and training purposes. Players can practice and develop skills in a virtual environment that closely mimics real-world scenarios.",
      },
    ],
    relatedProduct: "altie-studios",
  },
  {
    slug: "realestatexr",
    route: "/realestatexr",
    eyebrow: "Museums & Culture",
    name: "Museums & Culture",
    title: "Extended Reality for Museums",
    lead:
      "Extended Reality in museums combines Virtual Reality, Augmented Reality and Mixed Reality to create immersive, interactive experiences that raise visitor engagement and learning. Our solutions turn traditional museum spaces into dynamic environments where visitors explore exhibits in entirely new ways.",
    image: "/media/images/3dd.webp",
    imageAlt: "Extended reality exhibition experience in a museum",
    useCases: [
      "Immersive storytelling through interactive 3D reconstructions and animations",
      "Interactive learning with gamified tours and educational content",
      "Accessibility and inclusion through multilingual content and audio guides",
      "Virtual exhibitions that extend a collection's reach worldwide",
      "3D reconstructions of ancient cities and artifacts with historical context",
      "AR overlays on artworks that reveal hidden detail and artist stories",
    ],
    benefits: [
      {
        title: "Immersive storytelling",
        body:
          "Create compelling narratives that bring historical events and artifacts to life through interactive 3D reconstructions and animations.",
      },
      {
        title: "Interactive learning",
        body:
          "Engage visitors with hands-on digital experiences, gamified tours, and educational content that makes learning memorable.",
      },
      {
        title: "Accessibility & inclusion",
        body:
          "Make your museum accessible to all with multilingual content, audio guides, and visual enhancements for diverse audiences.",
      },
      {
        title: "Virtual exhibitions",
        body:
          "Extend your museum's reach with virtual exhibitions that allow visitors to explore collections from anywhere in the world.",
      },
    ],
  },
];

module.exports = { company, social, products, industries };
