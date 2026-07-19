import { StudentProfile, StudyTask, ResumeAnalysis, InterviewRoundState, LearningDNA, RoadmapProgress } from '../types';

/**
 * Calculates and retrieves the current user's AI Learning DNA based on their profile, 
 * roadmap records in localStorage, study tasks, resume analysis, and interview performances.
 */
export function calculateLearningDNA(
  profile: StudentProfile,
  studyTasks: StudyTask[] = [],
  resumeAnalysis: ResumeAnalysis | null = null,
  activeInterview: InterviewRoundState | null = null,
  streakDays: number = 5
): LearningDNA {
  // 1. Gather all course progresses from localStorage
  const progressObjects: { [courseName: string]: RoadmapProgress } = {};
  let totalCompletedDays = 0;
  let totalPossibleDays = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('roadmap_progress_')) {
        const courseName = key.replace('roadmap_progress_', '');
        const val = localStorage.getItem(key);
        if (val) {
          try {
            const parsed = JSON.parse(val) as RoadmapProgress;
            progressObjects[courseName] = parsed;
            
            // Try to match with roadmap structure to calculate exact progress %
            const structKey = `roadmap_structure_${courseName}`;
            const structVal = localStorage.getItem(structKey);
            if (structVal) {
              const structParsed = JSON.parse(structVal);
              if (structParsed && Array.isArray(structParsed.days)) {
                totalPossibleDays += structParsed.days.length;
                totalCompletedDays += parsed.completedDays?.length || 0;
              }
            } else {
              // Fallback: estimate based on completed days
              totalCompletedDays += parsed.completedDays?.length || 0;
              totalPossibleDays += Math.max(parsed.unlockedDays?.length || 1, parsed.completedDays?.length || 1, 5);
            }
          } catch (e) {
            console.error('Failed to parse roadmap progress for', courseName, e);
          }
        }
      }
    }
  } catch (e) {
    console.error('Error scanning localStorage progress', e);
  }

  // 2. Map Learning Style
  let preferredStyle: 'Visual' | 'Reading' | 'Hands-on' | 'Video' = 'Visual';
  if (profile.learningStyle === 'Video') preferredStyle = 'Video';
  else if (profile.learningStyle === 'Reading') preferredStyle = 'Reading';
  else if (profile.learningStyle === 'Practical') preferredStyle = 'Hands-on';
  else preferredStyle = 'Visual';

  // 3. Quiz Performance Stats
  let quizPassed = 0;
  let quizFailed = 0;
  let quizTotalScoreSum = 0;
  let quizCount = 0;
  let failedAttemptsCount = 0;

  Object.values(progressObjects).forEach((p) => {
    if (p.quizScores) {
      Object.entries(p.quizScores).forEach(([dayId, score]) => {
        quizCount++;
        quizTotalScoreSum += score;
        if (score >= 60) {
          quizPassed++;
        } else {
          quizFailed++;
        }
      });
    }
    if (p.failedAttempts) {
      Object.values(p.failedAttempts).forEach((count) => {
        failedAttemptsCount += count || 0;
      });
    }
  });

  const quizAverage = quizCount > 0 ? Math.round(quizTotalScoreSum / quizCount) : 0;

  // 4. Coding Performance Stats
  let codingTotalScoreSum = 0;
  let codingCount = 0;

  Object.values(progressObjects).forEach((p) => {
    if (p.codingScores) {
      Object.entries(p.codingScores).forEach(([dayId, score]) => {
        codingCount++;
        codingTotalScoreSum += score;
      });
    }
  });

  const codingAverage = codingCount > 0 ? Math.round(codingTotalScoreSum / codingCount) : 0;

  // 5. Completed Projects & Certifications
  const completedProjects = new Set<string>();
  const certificates = new Set<string>();

  // Extract from study planner tasks
  studyTasks.forEach((task) => {
    if (task.status === 'completed') {
      const titleLower = task.title.toLowerCase();
      if (titleLower.includes('project') || titleLower.includes('build') || titleLower.includes('develop') || titleLower.includes('create')) {
        completedProjects.add(task.title);
      }
      if (titleLower.includes('certificate') || titleLower.includes('certify') || titleLower.includes('exam') || titleLower.includes('credential')) {
        certificates.add(task.title);
      }
    }
  });

  // Extract from complete roadmaps (100% completion gives automatic certification)
  Object.entries(progressObjects).forEach(([courseName, p]) => {
    const structKey = `roadmap_structure_${courseName}`;
    const structVal = localStorage.getItem(structKey);
    if (structVal) {
      try {
        const structParsed = JSON.parse(structVal);
        if (structParsed && Array.isArray(structParsed.days) && p.completedDays && p.completedDays.length >= structParsed.days.length && structParsed.days.length > 0) {
          certificates.add(`Certificate of Completion in ${courseName}`);
        }
      } catch (e) {}
    }
  });

  // 6. Mock Interview Scores persistence
  let storedScores: number[] = [];
  try {
    const historicalVal = localStorage.getItem('halohex_interview_scores');
    if (historicalVal) {
      storedScores = JSON.parse(historicalVal);
    }
  } catch (e) {}

  if (activeInterview && activeInterview.isComplete && activeInterview.answers.length > 0) {
    const currentRating = activeInterview.answers.reduce((acc, c) => acc + c.overallRating, 0) / activeInterview.answers.length;
    const percentageScore = Math.round(currentRating * 20); // convert 5-star to 100%
    if (!storedScores.includes(percentageScore)) {
      storedScores.push(percentageScore);
      try {
        localStorage.setItem('halohex_interview_scores', JSON.stringify(storedScores));
      } catch (e) {}
    }
  }

  // 7. ATS Resume score
  const atsResumeScore = resumeAnalysis ? resumeAnalysis.atsScore : 0;

  // 8. Strong Skills & Weak Skills computation
  const strongSkills = new Set<string>(profile.skills || []);
  const weakSkills = new Set<string>();

  // Add resume's missing skills to weak skills
  if (resumeAnalysis?.missingSkills) {
    resumeAnalysis.missingSkills.forEach(s => {
      weakSkills.add(s);
      strongSkills.delete(s);
    });
  }

  // Failures on quizzes / assessments indicates weak skills
  Object.entries(progressObjects).forEach(([courseName, p]) => {
    if (p.failedAttempts) {
      Object.entries(p.failedAttempts).forEach(([dayId, count]) => {
        if (count && count > 1) {
          weakSkills.add(courseName);
          strongSkills.delete(courseName);
        }
      });
    }
    // High quiz or coding scores indicates strong skill
    if (p.quizScores) {
      const highScores = Object.values(p.quizScores).filter(score => score >= 85);
      if (highScores.length >= 2) {
        strongSkills.add(courseName);
        weakSkills.delete(courseName);
      }
    }
  });

  // 9. Learning Speed
  let learningSpeed: 'Slow' | 'Moderate' | 'Fast' = 'Fast';
  if (failedAttemptsCount > 10) {
    learningSpeed = 'Slow';
  } else if (failedAttemptsCount > 4) {
    learningSpeed = 'Moderate';
  }

  // 10. Confidence Score
  let confidenceScore = 65; // base
  if (quizAverage > 75) confidenceScore += 10;
  if (codingAverage > 75) confidenceScore += 10;
  if (storedScores.length > 0) {
    const avgInterview = storedScores.reduce((a, b) => a + b, 0) / storedScores.length;
    confidenceScore += Math.round((avgInterview - 60) / 4);
  }
  confidenceScore = Math.max(40, Math.min(100, confidenceScore));

  // 11. Consistency Score
  let consistencyScore = 70;
  if (studyTasks.length > 0) {
    const completedTasks = studyTasks.filter(t => t.status === 'completed').length;
    consistencyScore = Math.round((completedTasks / studyTasks.length) * 100);
  }
  if (streakDays > 5) consistencyScore = Math.min(100, consistencyScore + 10);

  // 12. Overall Progress
  const overallProgress = totalPossibleDays > 0 ? Math.round((totalCompletedDays / totalPossibleDays) * 100) : 0;

  const currentEducation = `${profile.degree} in ${profile.branch}`;

  const dna: LearningDNA = {
    currentEducation,
    currentSemesterOrYear: profile.yearOfStudy,
    careerGoal: profile.dreamCareer,
    existingSkills: profile.skills || [],
    weakSkills: Array.from(weakSkills),
    strongSkills: Array.from(strongSkills),
    preferredLearningStyle: preferredStyle,
    dailyStudyTime: profile.studyHours,
    weeklyAvailability: `${profile.studyHours * 7} hours/week`,
    preferredLanguage: profile.preferredLanguage || 'English',
    targetCompletionDate: profile.timelineGoal || '6 months',
    completedProjects: Array.from(completedProjects),
    certificates: Array.from(certificates),
    mockInterviewScores: storedScores,
    atsResumeScore,
    quizPerformance: {
      passed: quizPassed,
      failed: quizFailed,
      total: quizCount,
      averageScore: quizAverage
    },
    codingPerformance: {
      completedProblems: codingCount,
      averageScore: codingAverage
    },
    learningSpeed,
    confidenceScore,
    consistencyScore,
    currentStreak: streakDays,
    overallProgress: Math.min(100, overallProgress)
  };

  // Keep a cached copy in local storage
  try {
    localStorage.setItem('learning_dna', JSON.stringify(dna));
  } catch (e) {}

  return dna;
}

/**
 * Returns a prompt injection string that summarizes the current student's AI Learning DNA
 * to guide the Gemini model in generating highly personalized mentorship context.
 */
export function getLearningDNAPromptContext(dna: LearningDNA): string {
  return `
[AI LEARNING DNA PROFILE ACTIVATED]
The student has the following synchronized learning parameters:
- Education Background: ${dna.currentEducation} (${dna.currentSemesterOrYear})
- Targeted Career Path: ${dna.careerGoal}
- Primary Languages Preferred: ${dna.preferredLanguage}
- Preferred Format: ${dna.preferredLearningStyle}-centric learning
- Dedicated Speed: ${dna.learningSpeed} learning speed, studying ${dna.dailyStudyTime} hours daily (${dna.weeklyAvailability})
- Current Metrics:
  * Overall Syllabus Completion Progress: ${dna.overallProgress}%
  * Weekly Streak: ${dna.currentStreak} active consecutive days
  * ATS Resume Alignment Score: ${dna.atsResumeScore}/100
  * Verified Weak Skills: [${dna.weakSkills.join(', ') || 'None detected yet'}]
  * Verified Strong Skills: [${dna.strongSkills.join(', ') || dna.existingSkills.join(', ')}]
  * Average Quiz Performance: ${dna.quizPerformance.averageScore}% (${dna.quizPerformance.passed} passed, ${dna.quizPerformance.failed} failed)
  * Average Code Challenge Accuracy: ${dna.codingPerformance.averageScore}% (${dna.codingPerformance.completedProblems} solved)
  * Completed Projects Portfolio: [${dna.completedProjects.join(', ') || 'None completed yet'}]
  * Earned Certifications: [${dna.certificates.join(', ') || 'None earned yet'}]
  * Historical Panel Mock Interview Grades: [${dna.mockInterviewScores.map(s => s + '%').join(', ') || 'No panel interviews completed yet'}]
  * Overall Academic Confidence Rating: ${dna.confidenceScore}/100
  * Scheduling Consistency Index: ${dna.consistencyScore}/100

Please strictly adapt all responses, schedules, interview questions, coding difficulties, and project suggestions to perfectly line up with this student's exact AI Learning DNA. Keep tone highly encouraging, precise, and professional. Do NOT mention these system markers directly to the student unless they explicitly ask to see their AI Learning DNA metadata.
`;
}
