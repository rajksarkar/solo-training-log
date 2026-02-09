import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GLOBAL_EXERCISES: Array<{
  name: string;
  category: "strength" | "cardio" | "zone2" | "pilates" | "mobility" | "plyometrics" | "stretching" | "other";
  muscles: string[];
  equipment: string[];
  instructions: string;
  youtubeId?: string;
}> = [
  // ─── Strength - Compound ───
  {
    name: "Bench Press",
    category: "strength",
    muscles: ["chest", "triceps", "shoulders"],
    equipment: ["barbell", "bench"],
    instructions: `1. Lie on bench with feet flat on the floor.
2. Grip bar slightly wider than shoulder-width.
3. Unrack and hold bar over chest with arms extended.
4. Lower bar to mid-chest with control (3-4 second descent).
5. Press up until arms are fully extended. Keep shoulder blades retracted and squeezed throughout.
6. Don't bounce the bar off your chest.`,
    youtubeId: "gRVjAtPip0Y",
  },
  {
    name: "Back Squat",
    category: "strength",
    muscles: ["quadriceps", "glutes", "hamstrings", "core"],
    equipment: ["barbell", "rack"],
    instructions: `1. Bar on upper back (high or low bar position).
2. Feet shoulder-width or slightly wider, toes angled out 15-30°.
3. Take a breath, brace core, descend by pushing hips back and bending knees.
4. Go to at least parallel (hip crease below knee).
5. Drive through heels and mid-foot to stand. Keep chest up.`,
    youtubeId: "Dy28eq2PjcM",
  },
  {
    name: "Deadlift",
    category: "strength",
    muscles: ["hamstrings", "glutes", "lower back", "core"],
    equipment: ["barbell"],
    instructions: `1. Feet hip-width, bar over mid-foot.
2. Hinge at hips, grip bar outside knees.
3. Set back flat, chest up, lats engaged.
4. Push through the floor, extend hips and knees together.
5. Keep bar close to body throughout. Lock out at top.
6. Lower with control—hinge hips first, then bend knees.`,
    youtubeId: "op9kVnSso6Q",
  },
  {
    name: "Overhead Press",
    category: "strength",
    muscles: ["shoulders", "triceps", "core"],
    equipment: ["barbell"],
    instructions: `1. Bar at collarbone, grip just outside shoulders.
2. Brace core, squeeze glutes.
3. Press bar straight up in a slight arc.
4. Lock out overhead with arms fully extended.
5. Lower with control to collarbone.`,
    youtubeId: "YNK3eQVevIs",
  },
  {
    name: "Pull-Up",
    category: "strength",
    muscles: ["lats", "biceps", "core"],
    equipment: ["pull-up bar"],
    instructions: `1. Hang from bar with overhand grip, hands slightly wider than shoulders.
2. Pull shoulder blades down and back.
3. Pull yourself up until chin clears the bar.
4. Lower with control to full hang. Avoid kipping or swinging.`,
    youtubeId: "HFzrFHqszQM",
  },
  {
    name: "Chin-Up",
    category: "strength",
    muscles: ["lats", "biceps"],
    equipment: ["pull-up bar"],
    instructions: `1. Hang from bar with underhand grip, hands shoulder-width.
2. Pull up until chin clears the bar.
3. Lower with control. Slightly more bicep focus than pull-ups.`,
    youtubeId: "CjXwnIXoUb4",
  },
  {
    name: "Barbell Row",
    category: "strength",
    muscles: ["lats", "rhomboids", "biceps"],
    equipment: ["barbell"],
    instructions: `1. Hinge at hips, bar hanging at arms' length.
2. Keep back flat, core braced.
3. Pull bar to lower chest/upper abs, squeeze shoulder blades.
4. Lower with control. Don't round the lower back.`,
    youtubeId: "kBWAon7ItDw",
  },
  {
    name: "Dumbbell Row",
    category: "strength",
    muscles: ["lats", "rhomboids", "biceps"],
    equipment: ["dumbbell", "bench"],
    instructions: `1. Support on bench with one hand and same-side knee.
2. Row dumbbell to hip, elbow close to body.
3. Squeeze at the top. Lower with control.`,
    youtubeId: "roCP6wCXPqo",
  },
  {
    name: "Hip Thrust",
    category: "strength",
    muscles: ["glutes", "hamstrings"],
    equipment: ["barbell", "bench"],
    instructions: `1. Upper back on bench (bottom of shoulder blades), feet flat.
2. Bar over hips, drive through heels to extend hips.
3. Squeeze glutes at top. Lower with control.
4. Bench ~16" height works for most.`,
    youtubeId: "qFxTNOiQIAU",
  },
  {
    name: "Romanian Deadlift",
    category: "strength",
    muscles: ["hamstrings", "glutes", "lower back"],
    equipment: ["barbell"],
    instructions: `1. Stand with bar, knees slightly bent.
2. Hinge at hips, push hips back, lower bar along legs.
3. Feel hamstring stretch. Don't round the back.
4. Drive hips forward to stand.`,
    youtubeId: "JCXUYuzwNrM",
  },
  // NEW compound exercises
  {
    name: "Front Squat",
    category: "strength",
    muscles: ["quadriceps", "glutes", "core"],
    equipment: ["barbell", "rack"],
    instructions: `1. Bar rests on front deltoids, elbows high.
2. Feet shoulder-width, toes out slightly.
3. Descend keeping torso upright.
4. Drive through heels to stand. Elbows stay high throughout.`,
    youtubeId: "nmUof3vszxM",
    },
  {
    name: "Sumo Deadlift",
    category: "strength",
    muscles: ["glutes", "hamstrings", "adductors", "core"],
    equipment: ["barbell"],
    instructions: `1. Wide stance, toes pointed out 45°.
2. Grip bar inside knees with arms straight.
3. Push knees out, drive through the floor.
4. Lock out hips at top. Keep chest up.`,
    youtubeId: "e7oLkRlT2CQ",
    },
  {
    name: "Close-Grip Bench Press",
    category: "strength",
    muscles: ["triceps", "chest", "shoulders"],
    equipment: ["barbell", "bench"],
    instructions: `1. Grip bar shoulder-width or slightly narrower.
2. Lower to lower chest, elbows tucked.
3. Press up, focusing on tricep engagement.`,
    youtubeId: "NKHhj7SJsQA",
    },
  {
    name: "Pendlay Row",
    category: "strength",
    muscles: ["lats", "rhomboids", "lower back"],
    equipment: ["barbell"],
    instructions: `1. Bar on floor each rep, torso parallel to ground.
2. Explosively pull bar to lower chest.
3. Lower bar back to floor with control. Reset position each rep.`,
    youtubeId: "tYxEGi7ir4I",
    },
  {
    name: "T-Bar Row",
    category: "strength",
    muscles: ["lats", "rhomboids", "biceps"],
    equipment: ["t-bar machine", "barbell"],
    instructions: `1. Straddle bar or use machine, hinged forward.
2. Pull weight to chest, squeezing upper back.
3. Lower with control. Keep core braced.`,
    youtubeId: "8c23NBbwLBc",
    },
  {
    name: "Dips",
    category: "strength",
    muscles: ["chest", "triceps", "shoulders"],
    equipment: ["dip bars"],
    instructions: `1. Support yourself on parallel bars, arms locked.
2. Lean slightly forward for chest emphasis, or stay upright for triceps.
3. Lower until upper arms are parallel to floor.
4. Press up to lockout.`,
    youtubeId: "vi1-BOcj3cQ",
    },
  {
    name: "Landmine Press",
    category: "strength",
    muscles: ["shoulders", "chest", "triceps"],
    equipment: ["barbell", "landmine attachment"],
    instructions: `1. Hold end of barbell at shoulder height.
2. Press up and forward at an angle.
3. Lower with control. Great for shoulder health.`,
    youtubeId: "6cSTRPhpubs",
    },
  {
    name: "Zercher Squat",
    category: "strength",
    muscles: ["quadriceps", "glutes", "core", "biceps"],
    equipment: ["barbell"],
    instructions: `1. Bar held in crook of elbows against torso.
2. Squat down keeping torso upright.
3. Drive through heels to stand. Core stays braced throughout.`,
    youtubeId: "IWofyrgYKh4",
    },

  // ─── Strength - Legs ───
  {
    name: "Goblet Squat",
    category: "strength",
    muscles: ["quadriceps", "glutes", "core"],
    equipment: ["dumbbell", "kettlebell"],
    instructions: `1. Hold weight at chest (goblet hold).
2. Squat down, keep elbows inside knees.
3. Drive through heels to stand.`,
    youtubeId: "2C-uNgKwPLE",
  },
  {
    name: "Lunges",
    category: "strength",
    muscles: ["quadriceps", "glutes", "hamstrings"],
    equipment: ["bodyweight", "dumbbells"],
    instructions: `1. Step forward, lower back knee toward floor.
2. Front knee over ankle, torso upright.
3. Push through front heel to return.`,
    youtubeId: "QOVaHwm-Q6U",
  },
  {
    name: "Bulgarian Split Squat",
    category: "strength",
    muscles: ["quadriceps", "glutes"],
    equipment: ["dumbbells", "bench"],
    instructions: `1. Rear foot elevated on bench behind you.
2. Lower until front thigh is parallel to floor.
3. Drive through front leg to stand.`,
    youtubeId: "2C-uNgKwPLE",
  },
  {
    name: "Leg Press",
    category: "strength",
    muscles: ["quadriceps", "glutes", "hamstrings"],
    equipment: ["leg press machine"],
    instructions: `1. Feet on platform, shoulder-width or wider.
2. Push through heels to extend legs.
3. Don't lock knees. Lower with control.`,
    youtubeId: "nDh_BlnLCGc",
    },
  {
    name: "Leg Curl",
    category: "strength",
    muscles: ["hamstrings"],
    equipment: ["leg curl machine"],
    instructions: `1. Curl heels toward glutes.
2. Control the eccentric (lowering).
3. Squeeze hamstrings at top.`,
    youtubeId: "_lgE0gPvbik",
    },
  {
    name: "Leg Extension",
    category: "strength",
    muscles: ["quadriceps"],
    equipment: ["leg extension machine"],
    instructions: `1. Extend legs against pad.
2. Squeeze quads at top. Don't lock knees.
3. Lower with control.`,
    youtubeId: "ztNBgrGy6FQ",
    },
  {
    name: "Calf Raise",
    category: "strength",
    muscles: ["calves"],
    equipment: ["bodyweight", "machine", "dumbbells"],
    instructions: `1. Rise onto toes. Hold at top for 1-2 sec.
2. Lower with full range of motion.`,
    youtubeId: "baEXLy09Ncc",
    },
  // NEW leg exercises
  {
    name: "Hack Squat",
    category: "strength",
    muscles: ["quadriceps", "glutes"],
    equipment: ["hack squat machine"],
    instructions: `1. Shoulders under pads, feet on platform.
2. Lower by bending knees to 90° or below.
3. Press up through heels. Great for quad isolation.`,
    youtubeId: "g9i05umL5vc",
    },
  {
    name: "Step-Ups",
    category: "strength",
    muscles: ["quadriceps", "glutes", "hamstrings"],
    equipment: ["bench", "dumbbells"],
    instructions: `1. Step onto elevated surface with one foot.
2. Drive through heel to stand on top.
3. Lower with control. Alternate or do all reps per side.`,
    youtubeId: "8q9LVgN2RD4",
    },
  {
    name: "Sissy Squat",
    category: "strength",
    muscles: ["quadriceps"],
    equipment: ["bodyweight"],
    instructions: `1. Stand on toes, lean back while bending knees.
2. Lower until knees are well past toes, thighs are stretched.
3. Use quad strength to return. Hold support if needed.`,
    youtubeId: "DOxGMy258rM",
    },
  {
    name: "Glute-Ham Raise",
    category: "strength",
    muscles: ["hamstrings", "glutes"],
    equipment: ["GHD machine"],
    instructions: `1. Feet locked in, knees on pad.
2. Lower torso toward floor under control.
3. Curl back up using hamstrings and glutes. Powerful posterior chain exercise.`,
    youtubeId: "c2pWqsHR7FU",
    },
  {
    name: "Seated Calf Raise",
    category: "strength",
    muscles: ["calves"],
    equipment: ["seated calf machine"],
    instructions: `1. Knees under pad, balls of feet on platform.
2. Rise onto toes, squeeze at top.
3. Lower with full stretch. Targets the soleus muscle.`,
    youtubeId: "6O5hh1rBtx8",
    },

  // ─── Strength - Upper Push ───
  {
    name: "Incline Bench Press",
    category: "strength",
    muscles: ["upper chest", "shoulders", "triceps"],
    equipment: ["barbell", "incline bench"],
    instructions: `1. Bench at 30-45 degrees.
2. Same form as flat bench—unrack, lower to upper chest.
3. Emphasizes upper chest.`,
    youtubeId: "gRVjAtPip0Y",
  },
  {
    name: "Dumbbell Fly",
    category: "strength",
    muscles: ["chest"],
    equipment: ["dumbbells", "bench"],
    instructions: `1. Arms extended with slight bend.
2. Lower weights out to sides in an arc.
3. Bring back up. Control the stretch.`,
    youtubeId: "QENKPHhQVi4",
    },
  {
    name: "Cable Crossover",
    category: "strength",
    muscles: ["chest"],
    equipment: ["cable machine"],
    instructions: `1. Cables at shoulder height.
2. Bring handles together in front.
3. Squeeze chest. Control the return.`,
    youtubeId: "tGXIQR89-JE",
    },
  // NEW upper push
  {
    name: "DB Bench Press",
    category: "strength",
    muscles: ["chest", "triceps", "shoulders"],
    equipment: ["dumbbells", "bench"],
    instructions: `1. Lie on bench, dumbbells at shoulder level.
2. Press up until arms extended.
3. Lower with control. Greater range of motion than barbell.`,
    youtubeId: "1V3vpcaxRYQ",
    },
  {
    name: "Decline Bench Press",
    category: "strength",
    muscles: ["lower chest", "triceps"],
    equipment: ["barbell", "decline bench"],
    instructions: `1. Lie on decline bench, feet secured.
2. Lower bar to lower chest.
3. Press up. Emphasizes lower chest fibers.`,
    youtubeId: "a-UFQE4oxWY",
    },
  {
    name: "Machine Chest Press",
    category: "strength",
    muscles: ["chest", "triceps", "shoulders"],
    equipment: ["chest press machine"],
    instructions: `1. Adjust seat so handles are at chest level.
2. Press forward until arms extended.
3. Return with control. Good for beginners and burnout sets.`,
    youtubeId: "JsQd_KYl4w8",
    },
  {
    name: "Arnold Press",
    category: "strength",
    muscles: ["shoulders", "triceps"],
    equipment: ["dumbbells"],
    instructions: `1. Start with dumbbells in front of face, palms facing you.
2. Rotate palms outward as you press overhead.
3. Reverse the motion on the way down. Hits all three deltoid heads.`,
    youtubeId: "6K_N9AGhItQ",
    },
  {
    name: "Push-Up",
    category: "strength",
    muscles: ["chest", "triceps", "shoulders", "core"],
    equipment: ["bodyweight"],
    instructions: `1. Hands shoulder-width, body in straight line.
2. Lower chest to floor, elbows at 45°.
3. Press up to full extension. Scale with knees or elevation.`,
    youtubeId: "_YrJc-kTYA0",
    },

  // ─── Strength - Upper Pull ───
  {
    name: "Lat Pulldown",
    category: "strength",
    muscles: ["lats", "biceps"],
    equipment: ["cable machine"],
    instructions: `1. Grip bar wide.
2. Pull to upper chest, squeeze lats.
3. Control the return.`,
    youtubeId: "SALxEARiMkw",
    },
  {
    name: "Cable Row",
    category: "strength",
    muscles: ["lats", "rhomboids", "biceps"],
    equipment: ["cable machine"],
    instructions: `1. Seated, pull handle to stomach.
2. Squeeze shoulder blades. Keep torso stable.`,
    youtubeId: "vwHG9Jfu4sw",
    },
  {
    name: "Face Pull",
    category: "strength",
    muscles: ["rear delts", "rhomboids"],
    equipment: ["cable machine", "resistance band"],
    instructions: `1. Pull rope to face level.
2. Externally rotate at end.
3. Squeeze rear delts and upper back.`,
    youtubeId: "qEyoBOpvqR4",
    },
  {
    name: "Lateral Raise",
    category: "strength",
    muscles: ["shoulders"],
    equipment: ["dumbbells"],
    instructions: `1. Arms at sides, slight bend in elbows.
2. Raise to shoulder height.
3. Lower with control.`,
    youtubeId: "JMt_uxE8bBc",
    },
  // NEW upper pull
  {
    name: "Straight-Arm Pulldown",
    category: "strength",
    muscles: ["lats", "teres major"],
    equipment: ["cable machine"],
    instructions: `1. Stand facing cable, arms extended overhead.
2. Pull bar down to thighs keeping arms straight.
3. Squeeze lats at bottom. Return with control.`,
    youtubeId: "hAMcfubonDc",
    },
  {
    name: "Reverse Fly",
    category: "strength",
    muscles: ["rear delts", "rhomboids"],
    equipment: ["dumbbells", "machine"],
    instructions: `1. Bent over or on machine, arms hanging.
2. Raise arms out to sides, squeezing shoulder blades.
3. Lower with control. Keep slight bend in elbows.`,
    youtubeId: "-TKqxK7-ehc",
    },
  {
    name: "Chest-Supported Row",
    category: "strength",
    muscles: ["lats", "rhomboids", "biceps"],
    equipment: ["dumbbells", "incline bench"],
    instructions: `1. Lie face down on incline bench.
2. Row dumbbells up, squeezing shoulder blades.
3. Lower with control. Eliminates momentum and lower back stress.`,
    youtubeId: "oNsqMW1gPiU",
    },
  {
    name: "Meadows Row",
    category: "strength",
    muscles: ["lats", "rhomboids", "biceps"],
    equipment: ["barbell", "landmine attachment"],
    instructions: `1. Stand perpendicular to barbell in landmine.
2. Grip end of bar, staggered stance.
3. Row up and back, elbow driving past torso. Lower with control.`,
    youtubeId: "G-jU1aPVhnY",
    },

  // ─── Strength - Arms ───
  {
    name: "Tricep Pushdown",
    category: "strength",
    muscles: ["triceps"],
    equipment: ["cable machine"],
    instructions: `1. Elbows at sides.
2. Extend arms by pushing bar down.
3. Control the return.`,
    youtubeId: "Rc7-euA8FDI",
    },
  {
    name: "Bicep Curl",
    category: "strength",
    muscles: ["biceps"],
    equipment: ["dumbbells", "barbell"],
    instructions: `1. Arms at sides, curl weight to shoulders.
2. Keep elbows stationary. Lower with control.`,
    youtubeId: "iui51E31sX8",
    },
  {
    name: "Plank",
    category: "strength",
    muscles: ["core", "shoulders"],
    equipment: ["bodyweight"],
    instructions: `1. Forearms on floor, body in straight line.
2. Hold position. Don't let hips sag.`,
    youtubeId: "pSHjTRCQxIw",
  },
  // NEW arms
  {
    name: "Hammer Curl",
    category: "strength",
    muscles: ["biceps", "brachioradialis"],
    equipment: ["dumbbells"],
    instructions: `1. Hold dumbbells with neutral grip (palms facing each other).
2. Curl to shoulders keeping neutral grip.
3. Lower with control. Targets outer bicep and forearms.`,
    youtubeId: "BRVDS6HVR9Q",
    },
  {
    name: "Preacher Curl",
    category: "strength",
    muscles: ["biceps"],
    equipment: ["preacher bench", "barbell", "dumbbell"],
    instructions: `1. Arms on preacher bench pad, fully extended.
2. Curl weight up, squeezing biceps.
3. Lower with control—full stretch at bottom.`,
    youtubeId: "Htw-s61mOw0",
    },
  {
    name: "Concentration Curl",
    category: "strength",
    muscles: ["biceps"],
    equipment: ["dumbbell"],
    instructions: `1. Seated, elbow braced against inner thigh.
2. Curl dumbbell up, squeezing at top.
3. Lower with control. Isolates the bicep.`,
    youtubeId: "cHxRJdSVIkA",
    },
  {
    name: "Skull Crushers",
    category: "strength",
    muscles: ["triceps"],
    equipment: ["barbell", "dumbbells", "bench"],
    instructions: `1. Lie on bench, arms extended over face.
2. Bend elbows, lower weight toward forehead.
3. Extend arms back up. Keep elbows pointed at ceiling.`,
    youtubeId: "D1y1-sXZDA0",
    },
  {
    name: "OH Tricep Extension",
    category: "strength",
    muscles: ["triceps"],
    equipment: ["dumbbell", "cable machine"],
    instructions: `1. Hold weight overhead with arms extended.
2. Lower behind head by bending elbows.
3. Extend back up. Keep elbows close to ears.`,
    youtubeId: "9Ark9S11uXw",
    },
  {
    name: "Wrist Curls",
    category: "strength",
    muscles: ["forearms"],
    equipment: ["barbell", "dumbbells"],
    instructions: `1. Forearms on bench or knees, wrists hanging off edge.
2. Curl wrists up, squeezing forearms.
3. Lower with control. Do both palms-up and palms-down.`,
    youtubeId: "sKXqNO2KQp8",
    },
  {
    name: "Shrugs",
    category: "strength",
    muscles: ["traps"],
    equipment: ["barbell", "dumbbells"],
    instructions: `1. Hold weights at sides with arms straight.
2. Shrug shoulders straight up toward ears.
3. Hold at top, lower with control. Don't roll shoulders.`,
    youtubeId: "MlqHEfydPpE",
    },
  {
    name: "Upright Row",
    category: "strength",
    muscles: ["traps", "shoulders"],
    equipment: ["barbell", "dumbbells"],
    instructions: `1. Hold bar/dumbbells in front of thighs.
2. Pull straight up to chin, elbows leading.
3. Lower with control. Use moderate weight to protect shoulders.`,
    youtubeId: "jaAV-rD45I0",
    },

  // ─── Strength - Core ───
  {
    name: "Hanging Leg Raise",
    category: "strength",
    muscles: ["core", "hip flexors"],
    equipment: ["pull-up bar"],
    instructions: `1. Hang from bar with arms extended.
2. Raise legs to 90° or higher.
3. Lower with control. Avoid swinging.`,
    youtubeId: "2n4UqRIJyk4",
    },
  {
    name: "Ab Wheel Rollout",
    category: "strength",
    muscles: ["core", "shoulders", "lats"],
    equipment: ["ab wheel"],
    instructions: `1. Kneel with wheel in front.
2. Roll forward, extending body toward floor.
3. Pull back using core. Keep hips from sagging.`,
    youtubeId: "ndc391RFNUM",
    },
  {
    name: "Cable Woodchop",
    category: "strength",
    muscles: ["core", "obliques"],
    equipment: ["cable machine"],
    instructions: `1. Cable at high or low position.
2. Rotate torso, pulling cable diagonally across body.
3. Control the return. Keep arms mostly straight.`,
    youtubeId: "ZDt4MCvjMAA",
    },
  {
    name: "Russian Twist",
    category: "strength",
    muscles: ["obliques", "core"],
    equipment: ["bodyweight", "medicine ball"],
    instructions: `1. Sit with knees bent, lean back slightly.
2. Rotate torso side to side, touching weight to floor.
3. Keep feet off ground for added difficulty.`,
    youtubeId: "-BzNffL_6YE",
    },
  {
    name: "Dead Bug",
    category: "strength",
    muscles: ["core"],
    equipment: ["bodyweight"],
    instructions: `1. Lie on back, arms toward ceiling, knees at 90°.
2. Extend opposite arm and leg toward floor.
3. Return and switch sides. Keep lower back pressed to floor.`,
    youtubeId: "Aoipu_fl3HA",
    },
  {
    name: "Pallof Press",
    category: "strength",
    muscles: ["core", "obliques"],
    equipment: ["cable machine", "resistance band"],
    instructions: `1. Stand perpendicular to cable, handle at chest.
2. Press arms straight out, resisting rotation.
3. Hold 2-3 seconds. Return to chest. Anti-rotation exercise.`,
    youtubeId: "5aZ0IhJS8O8",
    },

  // ─── Cardio ───
  {
    name: "Running",
    category: "cardio",
    muscles: ["legs", "cardiovascular"],
    equipment: ["treadmill", "outdoor"],
    instructions: `1. Warm up 5 min. Maintain steady pace.
2. Cool down and stretch after.`,
    youtubeId: "pxJIqd_2nYM",
  },
  {
    name: "Cycling",
    category: "cardio",
    muscles: ["quadriceps", "glutes", "cardiovascular"],
    equipment: ["stationary bike", "road bike"],
    instructions: `1. Adjust resistance and cadence.
2. Maintain steady effort. Hydrate during longer rides.`,
    youtubeId: "uHueJIjyRag",
    },
  {
    name: "Rowing",
    category: "cardio",
    muscles: ["back", "legs", "arms", "cardiovascular"],
    equipment: ["rowing machine"],
    instructions: `1. Catch: knees bent, arms extended.
2. Drive: push with legs, then pull with arms.
3. Finish: handle to lower chest. Control the return.`,
    youtubeId: "dkEeV2PGMqY",
  },
  {
    name: "Elliptical",
    category: "cardio",
    muscles: ["legs", "cardiovascular"],
    equipment: ["elliptical machine"],
    instructions: `1. Smooth, controlled motion.
2. Use handles for upper body involvement if desired.`,
    youtubeId: "EesEvYohy5o",
    },
  {
    name: "Jump Rope",
    category: "cardio",
    muscles: ["calves", "cardiovascular"],
    equipment: ["jump rope"],
    instructions: `1. Light hops, minimal arm swing.
2. Vary speed and style for intensity.`,
    youtubeId: "IFgQfVQT_68",
    },
  // NEW cardio
  {
    name: "Swimming",
    category: "cardio",
    muscles: ["full body", "cardiovascular"],
    equipment: ["pool"],
    instructions: `1. Choose stroke (freestyle, backstroke, breaststroke).
2. Maintain consistent pace and breathing rhythm.
3. Use intervals or steady-state for conditioning.`,
    youtubeId: "5HLW2AI1Ink",
    },
  {
    name: "Stair Climber",
    category: "cardio",
    muscles: ["quadriceps", "glutes", "calves", "cardiovascular"],
    equipment: ["stair climber machine"],
    instructions: `1. Set pace and begin stepping.
2. Maintain upright posture, light grip on rails.
3. Drive through full foot, avoid leaning on handles.`,
    youtubeId: "6mYp_BNYD5Y",
    },
  {
    name: "Battle Ropes",
    category: "cardio",
    muscles: ["shoulders", "arms", "core", "cardiovascular"],
    equipment: ["battle ropes"],
    instructions: `1. Hold one end in each hand, slight squat stance.
2. Alternate arms creating waves, or slam both together.
3. Maintain intensity for timed intervals (20-40 sec).`,
    youtubeId: "pQb2xIGioyQ",
    },
  {
    name: "Assault Bike",
    category: "cardio",
    muscles: ["full body", "cardiovascular"],
    equipment: ["assault bike"],
    instructions: `1. Push and pull handles while pedaling.
2. Full body engagement. Great for intervals.
3. Scale intensity via pace and resistance.`,
    youtubeId: "6EjyZFoNLb0",
    },
  {
    name: "Sled Push",
    category: "cardio",
    muscles: ["quadriceps", "glutes", "calves", "cardiovascular"],
    equipment: ["sled"],
    instructions: `1. Load sled, grip handles at waist or shoulder height.
2. Drive through legs, pushing sled forward.
3. Take short, powerful steps. Great for conditioning.`,
    youtubeId: "Qw8q55JR5VY",
    },
  {
    name: "Ski Erg",
    category: "cardio",
    muscles: ["lats", "triceps", "core", "cardiovascular"],
    equipment: ["ski erg machine"],
    instructions: `1. Grip handles overhead, hinge forward pulling down.
2. Extend hips and drive hands past hips.
3. Return to start. Mimics cross-country skiing motion.`,
    youtubeId: "P7qpoJmX91I",
    },
  {
    name: "Hiking",
    category: "cardio",
    muscles: ["legs", "cardiovascular"],
    equipment: ["outdoor"],
    instructions: `1. Choose trail appropriate for fitness level.
2. Maintain steady pace, use trekking poles if needed.
3. Stay hydrated. Log distance and elevation gain.`,
    youtubeId: "Ul9ryQiK8VM",
    },

  // ─── Zone 2 ───
  {
    name: "Zone 2 Run",
    category: "zone2",
    muscles: ["legs", "cardiovascular"],
    equipment: ["treadmill", "outdoor"],
    instructions: `1. Easy pace—can hold a conversation.
2. 60-70% max HR. Build aerobic base. 30-90 min typical.`,
    youtubeId: "taO8kKsx448",
    },
  {
    name: "Zone 2 Bike",
    category: "zone2",
    muscles: ["legs", "cardiovascular"],
    equipment: ["stationary bike", "road bike"],
    instructions: `1. Low intensity, sustainable effort.
2. Should be able to breathe through nose. 30-90 min typical.`,
    youtubeId: "1RqY5EYOM0k",
    },
  {
    name: "Zone 2 Rowing",
    category: "zone2",
    muscles: ["back", "legs", "cardiovascular"],
    equipment: ["rowing machine"],
    instructions: `1. Steady, conversational pace.
2. Focus on technique. Build aerobic capacity.`,
    youtubeId: "AcmKvgkOAaA",
    },
  // NEW zone2
  {
    name: "Zone 2 Walk",
    category: "zone2",
    muscles: ["legs", "cardiovascular"],
    equipment: ["treadmill", "outdoor"],
    instructions: `1. Brisk walking pace at 60-70% max HR.
2. Great for recovery days and building aerobic base.
3. 30-60 min typical. Use incline for added challenge.`,
    youtubeId: "-rMwrZCX64U",
    },
  {
    name: "Zone 2 Swim",
    category: "zone2",
    muscles: ["full body", "cardiovascular"],
    equipment: ["pool"],
    instructions: `1. Easy, sustainable swimming pace.
2. Focus on stroke efficiency and breathing.
3. 20-45 min typical. Keep heart rate in zone 2 range.`,
    youtubeId: "VAsYTcBdtOg",
    },
  {
    name: "Zone 2 Elliptical",
    category: "zone2",
    muscles: ["legs", "cardiovascular"],
    equipment: ["elliptical machine"],
    instructions: `1. Low resistance, moderate cadence.
2. Maintain conversational pace.
3. 30-60 min. Good low-impact zone 2 option.`,
    youtubeId: "EesEvYohy5o",
    },

  // ─── Pilates ───
  {
    name: "Mat Pilates",
    category: "pilates",
    muscles: ["core", "flexibility", "posture"],
    equipment: ["mat"],
    instructions: `1. Hundreds, roll-up, single leg circles.
2. Focus on controlled movements, core strength, and breath.`,
    youtubeId: "wj6yls2sXCg",
  },
  {
    name: "Reformer Pilates",
    category: "pilates",
    muscles: ["core", "full body", "flexibility"],
    equipment: ["reformer"],
    instructions: `1. Pilates on reformer machine.
2. Resistance from springs. Emphasis on alignment and control.`,
    youtubeId: "YEhD2pIj4Fo",
    },
  // NEW pilates
  {
    name: "Pilates Hundred",
    category: "pilates",
    muscles: ["core", "hip flexors"],
    equipment: ["mat"],
    instructions: `1. Lie on back, legs in tabletop or extended.
2. Curl head and shoulders up, arms by sides.
3. Pump arms up and down, breathing in for 5, out for 5.
4. Complete 100 pumps (10 breath cycles).`,
    youtubeId: "UaqpuUzs1i8",
    },
  {
    name: "Pilates Roll-Up",
    category: "pilates",
    muscles: ["core", "spinal flexibility"],
    equipment: ["mat"],
    instructions: `1. Lie flat, arms overhead.
2. Slowly roll up one vertebra at a time, reaching toward toes.
3. Roll back down with control. Focus on articulating through the spine.`,
    youtubeId: "PGnibcCcAUE",
    },
  {
    name: "Pilates Teaser",
    category: "pilates",
    muscles: ["core", "hip flexors"],
    equipment: ["mat"],
    instructions: `1. Lie on back, legs extended at 45°.
2. Roll up reaching arms toward toes, forming a V-shape.
3. Hold briefly, then roll back down with control. Advanced exercise.`,
    youtubeId: "UJ5gZQSqlXo",
    },

  // ─── Mobility ───
  {
    name: "Hip Mobility",
    category: "mobility",
    muscles: ["hips", "glutes"],
    equipment: ["bodyweight"],
    instructions: `1. Hip circles, 90/90 stretch, pigeon pose.
2. Hip flexor stretches. Hold 30-60 sec per side.`,
    youtubeId: "WUKHM6-ekJM",
    },
  {
    name: "Shoulder Mobility",
    category: "mobility",
    muscles: ["shoulders", "thoracic"],
    equipment: ["band", "bodyweight"],
    instructions: `1. Band pull-aparts, shoulder circles.
2. Doorway stretch. Improve range of motion and posture.`,
    youtubeId: "QPjIbr_sSCk",
    },
  // NEW mobility
  {
    name: "Thoracic Spine Mobility",
    category: "mobility",
    muscles: ["thoracic spine", "upper back"],
    equipment: ["foam roller", "bodyweight"],
    instructions: `1. Foam roller under upper back, hands behind head.
2. Extend over roller, opening chest.
3. Also do thoracic rotations on all fours. Hold 15-30 sec each position.`,
    youtubeId: "hhvHpsxKjXw",
    },
  {
    name: "Ankle Mobility",
    category: "mobility",
    muscles: ["ankles", "calves"],
    equipment: ["bodyweight", "wall"],
    instructions: `1. Half-kneeling facing wall, front foot 4-6 inches from wall.
2. Drive knee forward over toes toward wall.
3. Hold 15-30 sec per side. Critical for squat depth.`,
    youtubeId: "IikP_teeLkI",
    },
  {
    name: "Wrist Mobility",
    category: "mobility",
    muscles: ["wrists", "forearms"],
    equipment: ["bodyweight"],
    instructions: `1. On all fours, fingers forward, rock gently forward.
2. Rotate fingers to sides and back, stretching in each direction.
3. Wrist circles in both directions. 30 sec each position.`,
    youtubeId: "7xY-JrvtnC0",
    },
  {
    name: "Foam Rolling",
    category: "mobility",
    muscles: ["full body"],
    equipment: ["foam roller"],
    instructions: `1. Roll slowly over target muscle group.
2. Pause on tender spots for 20-30 seconds.
3. Cover IT band, quads, lats, thoracic spine, calves.`,
    youtubeId: "Oz4xHEgMaLY",
    },
  {
    name: "Lacrosse Ball Release",
    category: "mobility",
    muscles: ["glutes", "shoulders", "feet"],
    equipment: ["lacrosse ball"],
    instructions: `1. Place ball under target area (glute, shoulder, foot arch).
2. Apply body weight and roll slowly.
3. Hold on trigger points for 20-30 sec. Great for deep tissue work.`,
    youtubeId: "woX-IZfYd_g",
    },

  // ─── Plyometrics (NEW) ───
  {
    name: "Box Jumps",
    category: "plyometrics",
    muscles: ["quadriceps", "glutes", "calves"],
    equipment: ["plyo box"],
    instructions: `1. Stand facing box, feet hip-width.
2. Swing arms and jump onto box, landing softly with both feet.
3. Stand fully on top, then step down. Increase height progressively.`,
    youtubeId: "LeiLzSU3OXE",
    },
  {
    name: "Broad Jumps",
    category: "plyometrics",
    muscles: ["quadriceps", "glutes", "hamstrings"],
    equipment: ["bodyweight"],
    instructions: `1. Stand with feet shoulder-width.
2. Swing arms back, then explode forward and up.
3. Land softly with bent knees. Measure distance for progress.`,
    youtubeId: "6uwv-lFonDk",
    },
  {
    name: "Depth Jumps",
    category: "plyometrics",
    muscles: ["quadriceps", "glutes", "calves"],
    equipment: ["plyo box"],
    instructions: `1. Step off box (don't jump down).
2. Upon landing, immediately jump as high as possible.
3. Minimize ground contact time. Advanced exercise—build up to it.`,
    youtubeId: "AzPJZHOmGEg",
    },
  {
    name: "Tuck Jumps",
    category: "plyometrics",
    muscles: ["quadriceps", "core", "calves"],
    equipment: ["bodyweight"],
    instructions: `1. Stand with feet shoulder-width.
2. Jump up, pulling knees to chest at peak.
3. Land softly, immediately repeat. High intensity.`,
    youtubeId: "r7oBejx1PHM",
    },
  {
    name: "Plyo Push-Ups",
    category: "plyometrics",
    muscles: ["chest", "triceps", "shoulders"],
    equipment: ["bodyweight"],
    instructions: `1. Standard push-up position.
2. Lower chest to floor, then explode up so hands leave ground.
3. Land softly and immediately go into next rep. Clap optional.`,
    youtubeId: "Y-uF4F3mQIs",
    },
  {
    name: "Skater Jumps",
    category: "plyometrics",
    muscles: ["glutes", "quadriceps", "adductors"],
    equipment: ["bodyweight"],
    instructions: `1. Stand on one leg.
2. Jump laterally to opposite foot, landing softly.
3. Swing arms for momentum. Like a speed skater motion.`,
    youtubeId: "qM5jviFhw9U",
    },
  {
    name: "Bounding",
    category: "plyometrics",
    muscles: ["glutes", "hamstrings", "calves"],
    equipment: ["bodyweight"],
    instructions: `1. Exaggerated running strides with maximal height and distance.
2. Drive knee high, opposite arm forward.
3. Focus on hang time and powerful push-off each stride.`,
    youtubeId: "JKkDosoE_2U",
    },
  {
    name: "Lateral Hops",
    category: "plyometrics",
    muscles: ["ankles", "calves", "quadriceps"],
    equipment: ["bodyweight"],
    instructions: `1. Stand on one foot next to a line or cone.
2. Hop laterally back and forth quickly.
3. Stay light on feet, minimize ground contact. Great for ankle stability.`,
    youtubeId: "Nk9I6dOCneI",
    },

  // ─── Stretching (NEW) ───
  {
    name: "Hamstring Stretch",
    category: "stretching",
    muscles: ["hamstrings"],
    equipment: ["bodyweight", "mat"],
    instructions: `1. Seated or lying on back, extend one leg.
2. Reach toward toes or use a strap around foot.
3. Hold 30-60 sec per side. Keep back straight.`,
    youtubeId: "T_l0AyZywjU",
    },
  {
    name: "Quad Stretch",
    category: "stretching",
    muscles: ["quadriceps", "hip flexors"],
    equipment: ["bodyweight"],
    instructions: `1. Stand on one leg, pull opposite heel toward glute.
2. Keep knees together, hips pushed forward.
3. Hold 30-60 sec per side. Use wall for balance if needed.`,
    youtubeId: "zi5__zBRzYc",
    },
  {
    name: "Pigeon Pose",
    category: "stretching",
    muscles: ["glutes", "hip flexors", "piriformis"],
    equipment: ["mat"],
    instructions: `1. From all fours, bring one knee forward behind wrist.
2. Extend back leg behind you.
3. Lower hips toward floor. Hold 60-90 sec per side.`,
    youtubeId: "AI5A1PRYX7E",
    },
  {
    name: "Cat-Cow",
    category: "stretching",
    muscles: ["spine", "core"],
    equipment: ["mat"],
    instructions: `1. On all fours, inhale and arch back (cow—belly drops).
2. Exhale and round spine (cat—back toward ceiling).
3. Flow between positions for 10-15 reps. Great spinal warm-up.`,
    youtubeId: "LIVJZZyZ2qM",
    },
  {
    name: "Child's Pose",
    category: "stretching",
    muscles: ["lower back", "lats", "hips"],
    equipment: ["mat"],
    instructions: `1. Kneel, sit back on heels, arms extended forward.
2. Forehead on floor, relax into the stretch.
3. Hold 30-60 sec. Widen knees for a deeper hip stretch.`,
    youtubeId: "kH12QrSGedM",
    },
  {
    name: "Calf Stretch",
    category: "stretching",
    muscles: ["calves", "achilles"],
    equipment: ["wall", "step"],
    instructions: `1. Stand facing wall, one foot forward, one back.
2. Lean into wall keeping back heel down.
3. Hold 30-60 sec per side. Bend knee slightly for soleus.`,
    youtubeId: "TCnziUWGTf4",
    },
  {
    name: "Doorway Chest Stretch",
    category: "stretching",
    muscles: ["chest", "shoulders"],
    equipment: ["doorway"],
    instructions: `1. Place forearm on doorframe at 90°.
2. Step through doorway, turning away from arm.
3. Hold 30-60 sec per side. Great for posture correction.`,
    youtubeId: "B9uY01NoqBg",
    },
  {
    name: "Seated Spinal Twist",
    category: "stretching",
    muscles: ["spine", "obliques", "glutes"],
    equipment: ["mat"],
    instructions: `1. Sit with one leg extended, cross other foot over.
2. Twist torso toward bent knee, using elbow for leverage.
3. Hold 30-60 sec per side. Breathe into the stretch.`,
    youtubeId: "qEVNj4tcr0Y",
    },
];

async function main() {
  console.log("Seeding database...");

  for (const ex of GLOBAL_EXERCISES) {
    const existing = await prisma.exercise.findFirst({
      where: { name: ex.name, ownerId: null },
    });
    if (existing) {
      await prisma.exercise.update({
        where: { id: existing.id },
        data: {
          category: ex.category,
          muscles: ex.muscles,
          equipment: ex.equipment,
          instructions: ex.instructions,
          youtubeId: ex.youtubeId ?? null,
        },
      });
    } else {
      await prisma.exercise.create({
        data: {
          ownerId: null,
          name: ex.name,
          category: ex.category,
          muscles: ex.muscles,
          equipment: ex.equipment,
          instructions: ex.instructions,
          youtubeId: ex.youtubeId ?? null,
        },
      });
    }
  }

  console.log(`Seeded ${GLOBAL_EXERCISES.length} exercises.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
