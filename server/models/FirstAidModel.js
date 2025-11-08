// server/models/FirstAidModel.js

// AI-powered first aid instruction generator
// This uses rule-based AI with keyword matching and pattern recognition
// In production, this could be replaced with GPT-4, Claude, or a specialized medical AI

const ImageGenerator = require("../services/ImageGenerator");

// First aid knowledge base
const firstAidKnowledge = {
  // CPR / Unconscious / Not Breathing
  cpr: {
    keywords: ["unconscious", "not breathing", "no pulse", "cardiac arrest", "heart stopped", "cpr", "resuscitation"],
    title: "Cardiopulmonary Resuscitation (CPR)",
    severity: "Critical",
    overview: "CPR is a life-saving technique used when someone's breathing or heartbeat has stopped. Immediate action is crucial.",
    steps: [
      {
        title: "Check for Responsiveness",
        description: "Tap the person's shoulder and shout 'Are you okay?' If there's no response, call emergency services immediately.",
      },
      {
        title: "Open the Airway",
        description: "Place one hand on the forehead and two fingers under the chin. Tilt the head back to open the airway.",
      },
      {
        title: "Check for Breathing",
        description: "Look, listen, and feel for breathing for no more than 10 seconds. If not breathing normally, start CPR.",
      },
      {
        title: "Begin Chest Compressions",
        description: "Place the heel of one hand in the center of the chest. Place your other hand on top. Push hard and fast (100-120 compressions per minute). Allow chest to recoil between compressions.",
        video: "https://www.youtube.com/embed/n5hP4DIBCEE",
      },
      {
        title: "Give Rescue Breaths",
        description: "After 30 compressions, give 2 rescue breaths. Pinch the nose, cover the mouth with yours, and blow until you see the chest rise. Repeat cycles of 30 compressions and 2 breaths.",
      },
    ],
    importantNotes: [
      "Continue CPR until emergency services arrive or the person starts breathing.",
      "If you're untrained, hands-only CPR (compressions only) is better than nothing.",
      "Compressions should be at least 2 inches deep for adults.",
    ],
    whenToSeekHelp: "Call emergency services immediately. Continue CPR until help arrives.",
  },

  // Bleeding
  bleeding: {
    keywords: ["bleeding", "cut", "wound", "blood", "laceration", "hemorrhage", "injured", "open wound"],
    title: "Controlling Bleeding",
    severity: "High",
    overview: "Stop the bleeding as quickly as possible to prevent blood loss and shock.",
    steps: [
      {
        title: "Apply Direct Pressure",
        description: "Use a clean cloth or gauze and apply firm, direct pressure to the wound. Maintain pressure continuously.",
      },
      {
        title: "Elevate the Injury",
        description: "If possible, raise the injured area above the level of the heart to reduce blood flow to the area.",
      },
      {
        title: "Apply Bandage",
        description: "Once bleeding slows, apply a sterile bandage. Continue to apply pressure over the bandage.",
      },
      {
        title: "Don't Remove Objects",
        description: "If an object is embedded in the wound, don't remove it. Apply pressure around the object, not directly on it.",
      },
    ],
    importantNotes: [
      "Don't use a tourniquet unless bleeding is life-threatening and can't be stopped with direct pressure.",
      "Keep the person calm and lying down if possible.",
      "Monitor for signs of shock: pale skin, rapid pulse, dizziness.",
    ],
    whenToSeekHelp: "Seek immediate medical help if bleeding is severe, doesn't stop after 10-15 minutes of pressure, or if the wound is deep or caused by a serious injury.",
  },

  // Choking
  choking: {
    keywords: ["choking", "can't breathe", "object stuck", "throat", "swallowed", "blocked airway"],
    title: "Choking - Heimlich Maneuver",
    severity: "Critical",
    overview: "Choking occurs when an object blocks the airway. Quick action is essential.",
    steps: [
      {
        title: "Recognize Choking",
        description: "Signs include inability to speak, cough, or breathe. The person may clutch their throat.",
      },
      {
        title: "Perform Back Blows",
        description: "For adults and children, give 5 back blows between the shoulder blades with the heel of your hand.",
      },
      {
        title: "Perform Abdominal Thrusts (Heimlich)",
        description: "Stand behind the person. Place your arms around their waist. Make a fist with one hand, place it above the navel, and grasp it with your other hand. Give quick, upward thrusts.",
        video: "https://www.youtube.com/embed/7CgtIgSyAiU",
      },
      {
        title: "Continue Until Object is Expelled",
        description: "Alternate between 5 back blows and 5 abdominal thrusts until the object is expelled or the person becomes unconscious.",
      },
    ],
    importantNotes: [
      "For infants, use back blows and chest thrusts instead of abdominal thrusts.",
      "If the person becomes unconscious, start CPR.",
      "Never perform the Heimlich on a person who can cough or speak.",
    ],
    whenToSeekHelp: "Call emergency services immediately if the person is choking. Continue first aid until help arrives.",
  },

  // Burns
  burns: {
    keywords: ["burn", "scald", "hot", "fire", "steam", "chemical burn", "sunburn"],
    title: "Burn Treatment",
    severity: "Moderate",
    overview: "Immediate treatment can minimize damage and prevent infection.",
    steps: [
      {
        title: "Cool the Burn",
        description: "Hold the burned area under cool (not cold) running water for 10-15 minutes or until pain subsides. Don't use ice.",
      },
      {
        title: "Remove Constrictive Items",
        description: "Remove jewelry, belts, or tight clothing from the burned area before it swells.",
      },
      {
        title: "Cover the Burn",
        description: "Cover the burn with a sterile, non-adhesive bandage or clean cloth. Don't break blisters.",
      },
      {
        title: "Manage Pain",
        description: "Over-the-counter pain relievers can help with pain. Keep the person comfortable.",
      },
    ],
    importantNotes: [
      "Don't apply butter, oil, or ointments to severe burns.",
      "Don't break blisters - they protect against infection.",
      "For chemical burns, flush with water for at least 20 minutes.",
    ],
    whenToSeekHelp: "Seek medical help for burns that are larger than 3 inches, affect the face, hands, feet, or genitals, or are caused by chemicals or electricity.",
  },

  // Seizures
  seizures: {
    keywords: ["seizure", "convulsion", "epilepsy", "shaking", "uncontrollable", "fit"],
    title: "Seizure First Aid",
    severity: "High",
    overview: "Most seizures are not medical emergencies, but proper first aid can prevent injury.",
    steps: [
      {
        title: "Keep the Person Safe",
        description: "Gently guide the person to the floor if they're not already there. Move furniture and objects away to prevent injury.",
      },
      {
        title: "Protect the Head",
        description: "Place something soft under their head (a pillow, folded jacket, or your hands) to prevent head injury.",
      },
      {
        title: "Don't Restrain",
        description: "Never hold the person down or put anything in their mouth. Turn them on their side to help with breathing.",
      },
      {
        title: "Time the Seizure",
        description: "Note how long the seizure lasts. Most seizures last 1-2 minutes.",
      },
    ],
    importantNotes: [
      "Don't put anything in the person's mouth - they cannot swallow their tongue.",
      "Stay with the person until the seizure ends and they are fully awake.",
      "After the seizure, the person may be confused - speak calmly and reassure them.",
    ],
    whenToSeekHelp: "Call emergency services if the seizure lasts more than 5 minutes, the person has multiple seizures, or if they're injured, pregnant, or have diabetes.",
  },

  // Fractures
  fractures: {
    keywords: ["broken bone", "fracture", "dislocation", "can't move", "deformed", "bone"],
    title: "Fracture / Broken Bone First Aid",
    severity: "High",
    overview: "Immobilize the injury to prevent further damage until medical help arrives.",
    steps: [
      {
        title: "Don't Move the Person",
        description: "If the injury is to the neck, back, or head, don't move the person unless they're in immediate danger.",
      },
      {
        title: "Stop Any Bleeding",
        description: "If there's bleeding, apply pressure with a clean cloth. Don't try to realign the bone.",
      },
      {
        title: "Immobilize the Area",
        description: "If you must move the person, splint the injured area using boards, sticks, or rolled newspapers. Pad the splint with cloth.",
      },
      {
        title: "Apply Ice",
        description: "Apply a cold pack or ice wrapped in cloth to reduce swelling and pain. Don't apply ice directly to skin.",
      },
    ],
    importantNotes: [
      "Don't try to push a bone back into place if it's sticking out.",
      "Don't test the range of motion - this can cause more damage.",
      "Keep the person still and calm while waiting for medical help.",
    ],
    whenToSeekHelp: "Seek immediate medical attention for all suspected fractures. Don't delay - proper medical treatment is essential.",
  },

  // Shock
  shock: {
    keywords: ["shock", "pale", "dizzy", "weak pulse", "rapid breathing", "sweating", "nausea"],
    title: "Shock Treatment",
    severity: "Critical",
    overview: "Shock is a life-threatening condition that requires immediate medical attention.",
    steps: [
      {
        title: "Call Emergency Services",
        description: "Shock requires immediate medical attention. Call emergency services right away.",
      },
      {
        title: "Lay the Person Down",
        description: "Have the person lie down on their back. Elevate their legs about 12 inches unless you suspect a head, neck, or back injury.",
      },
      {
        title: "Keep Them Warm",
        description: "Cover the person with a blanket or coat to keep them warm. Don't use a heating pad.",
      },
      {
        title: "Monitor Breathing",
        description: "Check for breathing. If they stop breathing, begin CPR. If they're vomiting, turn them on their side.",
      },
    ],
    importantNotes: [
      "Don't give the person anything to eat or drink.",
      "Don't move the person unless necessary.",
      "Stay with the person and monitor their condition until help arrives.",
    ],
    whenToSeekHelp: "Shock is a medical emergency. Call emergency services immediately and follow their instructions.",
  },
};

// Analyze description and determine first aid type
function analyzeSituation(description) {
  const lowerDesc = description.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const [key, data] of Object.entries(firstAidKnowledge)) {
    let score = 0;
    for (const keyword of data.keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      const matches = lowerDesc.match(regex);
      if (matches) {
        score += matches.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = key;
    }
  }

  // If no strong match, return general first aid
  if (bestScore < 1) {
    return "general";
  }

  return bestMatch;
}

// Generate first aid instructions based on situation
async function generateFirstAidInstructions(description, includeImages = true) {
  const situation = analyzeSituation(description);
  
  if (situation === "general") {
    const generalSteps = [
      {
        title: "Stay Calm",
        description: "Remain calm and assess the situation. Panic can make things worse.",
      },
      {
        title: "Ensure Safety",
        description: "Make sure the area is safe for both you and the injured person. Remove any immediate hazards.",
      },
      {
        title: "Call for Help",
        description: "If the situation is serious, call emergency services immediately. Provide clear information about the location and situation.",
      },
      {
        title: "Provide Basic Care",
        description: "Keep the person comfortable, monitor their breathing and consciousness, and provide reassurance.",
      },
    ];

    // Generate images for general steps only if includeImages is true
    const stepsWithImages = includeImages
      ? await Promise.all(
          generalSteps.map(async (step) => ({
            ...step,
            image: await ImageGenerator.getImageForStep("general", step.title, step.description),
          }))
        )
      : generalSteps;

    return {
      title: "General First Aid Instructions",
      severity: "Moderate",
      overview: "Based on your description, here are general first aid principles to follow while waiting for professional help.",
      steps: stepsWithImages,
      importantNotes: [
        "Don't move the person unless they're in immediate danger.",
        "Don't give food or water to an unconscious person.",
        "Monitor the person's condition and be ready to provide CPR if needed.",
      ],
      whenToSeekHelp: "If the situation is serious or you're unsure, seek professional medical help immediately.",
    };
  }

  const instructions = JSON.parse(JSON.stringify(firstAidKnowledge[situation])); // Deep copy
  
  // Generate images for each step only if includeImages is true
  if (includeImages) {
    instructions.steps = await Promise.all(
      instructions.steps.map(async (step) => {
        // Only generate image if step doesn't already have one, or if existing image is a broken Unsplash URL
        if (!step.image || step.image.includes("unsplash.com")) {
          step.image = await ImageGenerator.getImageForStep(situation, step.title, step.description);
        }
        return step;
      })
    );
  } else {
    // Remove images if includeImages is false
    instructions.steps = instructions.steps.map((step) => {
      const { image, ...stepWithoutImage } = step;
      return stepWithoutImage;
    });
  }
  
  // Add additional resources
  instructions.additionalResources = [
    {
      title: "American Red Cross First Aid Guide",
      url: "https://www.redcross.org/get-help/how-to-prepare-for-emergencies/types-of-emergencies",
    },
    {
      title: "Mayo Clinic First Aid",
      url: "https://www.mayoclinic.org/first-aid",
    },
  ];

  return instructions;
}

module.exports = {
  generateFirstAidInstructions,
  analyzeSituation,
};

