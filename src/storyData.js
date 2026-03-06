// ─── Intro story panels (typewriter text) ────────────────────────────────────
export const introBodyTexts = {
  en: [
    "For many years, people burned too many fossil fuels, cut down forests, and polluted the air.",
    "This caused climate change. There were huge storms, wildfires, floods, and droughts.",
    "Earth is in danger. Explore space to find a new home. Your mission begins now!"
  ],
  es: [
    "Durante muchos años, las personas quemaron demasiados combustibles fósiles, talaron bosques y contaminaron el aire.",
    "Esto causó el cambio climático. Hubo grandes tormentas, incendios, inundaciones y sequías.",
    "La Tierra está en peligro. Explora el espacio para encontrar un nuevo hogar. ¡Tu misión comienza ahora!"
  ]
}

// ─── Result messages (shown after planet selection) ───────────────────────────
export const resultMessages = {
  en: [
    "Correct! Humans may be able to live on Mars but only with technology and protection!",
    "Now, the real mission is protecting Earth. Earth is our best home. It has liquid water, oxygen, forests, animals and a protective atmosphere.",
    "We must work together to protect our planet. You can help by planting trees, using clean energy, walking or biking, reducing waste, and saving electricity. This is climate action."
  ],
  es: [
    "¡Correcto! Los humanos podrían vivir en Marte, ¡pero solo con tecnología y protección!",
    "Ahora, la verdadera misión es proteger la Tierra. La Tierra es nuestro mejor hogar. Tiene agua líquida, oxígeno, bosques, animales y una atmósfera protectora.",
    "Debemos trabajar juntos para proteger nuestro planeta. Puedes ayudar plantando árboles, usando energía limpia, caminando o andando en bicicleta, reduciendo residuos y ahorrando electricidad. Esto es acción climática."
  ]
}

// ─── Wrong-planet result messages ─────────────────────────────────────────────
export const wrongPlanetMessages = {
  en: [
    "Not quite. Most planets are too hot, too cold, or made of gas. Mars is one of the best options.",
    "Now, the real mission is protecting Earth. Earth is our best home. It has liquid water, oxygen, forests, animals and a protective atmosphere.",
    "We must work together to protect our planet. You can help by planting trees, using clean energy, walking or biking, reducing waste, and saving electricity. This is climate action."
  ],
  es: [
    "No exactamente. La mayoría de los planetas son demasiado calientes, demasiado fríos o están hechos de gas. Marte es una de las mejores opciones.",
    "Ahora, la verdadera misión es proteger la Tierra. La Tierra es nuestro mejor hogar. Tiene agua líquida, oxígeno, bosques, animales y una atmósfera protectora.",
    "Debemos trabajar juntos para proteger nuestro planeta. Puedes ayudar plantando árboles, usando energía limpia, caminando o andando en bicicleta, reduciendo residuos y ahorrando electricidad. Esto es clima."
  ]
}

// ─── Selection screen message ─────────────────────────────────────────────────
export const selectionMessage = {
  en: "Explorer, you've seen all the planets.\nSelect the best possible future home.",
  es: "Explorador, has visto todos los planetas.\nSelecciona el mejor hogar futuro posible."
}

// ─── Planet data ──────────────────────────────────────────────────────────────
export const planets = [
  {
    name: "Mercury",
    texture: "/textures/mercury.jpg",
    size: 1.3,
    facts: {
      en: [
        "This is Mercury, the closest planet to the Sun. It is extremely hot during the day… And freezing at night.",
        "There is no air. No water. No protection from the Sun. Could this be our new home?",
        "❌ No. A planet needs the right temperature and atmosphere to support life."
      ],
      es: [
        "Este es Mercurio, el planeta más cercano al Sol. Es muy caliente durante el día… Y helado de noche.",
        "No hay aire. No hay agua. No hay protección del Sol. ¿Podría ser nuestro nuevo hogar?",
        "❌ No. Un planeta necesita la temperatura y atmósfera correctas para tener vida."
      ]
    }
  },
  {
    name: "Venus",
    texture: "/textures/venus.jpg",
    size: 1.3,
    facts: {
      en: [
        "Welcome to Venus, the hottest planet in our solar system, even hotter than Mercury!",
        "Its clouds are made of acid. The air is poisonous. Is Venus our new home?",
        "❌ No! It's too hot and toxic. Humans cannot survive here."
      ],
      es: [
        "¡Bienvenido a Venus, el planeta más caliente de nuestro sistema solar, ¡incluso más caliente que Mercurio!",
        "Sus nubes están hechas de ácido. El aire es venenoso. ¿Es Venus nuestro nuevo hogar?",
        "❌ ¡No! Es demasiado caliente y tóxico. Los humanos no pueden sobrevivir aquí."
      ]
    }
  },
  {
    name: "Mars",
    texture: "/textures/mars.jpg",
    size: 1.3,
    facts: {
      en: [
        "This is Mars, the Red Planet! Its soil is full of rusty red iron dust.",
        "Scientists think we might build homes here one day. Could we move there?",
        "⚠️ Maybe! Mars is one of the best options so far… But humans would need protection."
      ],
      es: [
        "¡Este es Marte, el Planeta Rojo! Su suelo está lleno de polvo de hierro rojo oxidado.",
        "Los científicos creen que podríamos construir casas aquí algún día. ¿Podríamos mudarnos allí?",
        "⚠️ ¡Quizás! Marte es una de las mejores opciones hasta ahora… Pero los humanos necesitarían protección."
      ]
    }
  },
  {
    name: "Jupiter",
    texture: "/textures/jupiter.jpg",
    size: 1.3,
    facts: {
      en: [
        "Hello Jupiter! This is the biggest planet in our solar system",
        "It is made mostly of gas. There is no solid ground to stand on! It has a huge storm called the Great Red Spot. Can we live on a gas giant?",
        "❌ No! There is nowhere to stand!"
      ],
      es: [
        "¡Hola Júpiter! Este es el planeta más grande de nuestro sistema solar.",
        "Está hecho principalmente de gas. ¡No hay suelo sólido donde pararse! Tiene una enorme tormenta llamada la Gran Mancha Roja. ¿Podemos vivir en un gigante gaseoso?",
        "❌ ¡No! ¡No hay dónde pararse!"
      ]
    }
  },
  {
    name: "Saturn",
    texture: "/textures/saturn.jpg",
    size: 1.3,
    facts: {
      en: [
        "This is Saturn, famous for its stunning rings made of ice and rock chunks.",
        "Saturn is also a gas giant. It is freezing cold and very windy. Is it a safe place to live?",
        "❌ No solid ground. Too cold!"
      ],
      es: [
        "Este es Saturno, famoso por sus impresionantes anillos hechos de hielo y trozos de roca.",
        "Saturno también es un gigante gaseoso. Hace un frío extremo y hay mucho viento. ¿Es un lugar seguro para vivir?",
        "❌ ¡No hay suelo sólido. ¡Demasiado frío!"
      ]
    }
  },
  {
    name: "Uranus",
    texture: "/textures/uranus.jpg",
    size: 1.3,
    facts: {
      en: [
        "Welcome to Uranus! It spins on its side! Scientists think a giant collision long ago knocked it over.",
        "It is an icy gas giant. Temperatures are extremely cold. Hmm do we move here?",
        "❌ No! It's too cold and made of gas!"
      ],
      es: [
        "¡Bienvenido a Urano! ¡Gira de lado! Los científicos creen que una gran colisión hace mucho tiempo lo volcó.",
        "Es un gigante gaseoso helado. Las temperaturas son extremadamente frías. ¿Nos mudamos aquí?",
        "❌ ¡No! ¡Es demasiado frío y está hecho de gas!"
      ]
    }
  },
  {
    name: "Neptune",
    texture: "/textures/neptune.jpg",
    size: 1.3,
    facts: {
      en: [
        "Here we have Neptune, the farthest planet from the Sun.",
        "It has the strongest winds in the solar system! It is dark, freezing, and stormy. Is this a good place to live?",
        "❌ No it's too cold and too windy!"
      ],
      es: [
        "Aquí tenemos a Neptuno, el planeta más lejano del Sol.",
        "¡Tiene los vientos más fuertes del sistema solar! Es oscuro, helado y tormentoso. ¿Es este un buen lugar para vivir?",
        "❌ ¡No, hace demasiado frío y hay demasiado viento!"
      ]
    }
  }
]
