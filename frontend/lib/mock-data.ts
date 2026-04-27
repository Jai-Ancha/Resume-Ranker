import type { CandidateData } from "@/components/candidate-card"

const skillsPool = [
  "React", "TypeScript", "Node.js", "Python", "AWS", "Docker",
  "Kubernetes", "GraphQL", "PostgreSQL", "MongoDB", "Redis",
  "Next.js", "TailwindCSS", "CI/CD", "Git", "Agile", "REST APIs",
  "Machine Learning", "Data Analysis", "Leadership"
]

const missingSkillsPool = [
  "Rust", "Go", "Scala", "Terraform", "Azure", "GCP",
  "Kafka", "Elasticsearch", "Spark", "Hadoop"
]

const strengthsPool = [
  "Strong technical background with proven track record",
  "Excellent communication skills demonstrated in team projects",
  "Deep expertise in modern web technologies",
  "Experience leading cross-functional teams",
  "Strong problem-solving abilities",
  "Consistent career growth trajectory",
  "Relevant industry experience",
  "Outstanding project portfolio"
]

const improvementsPool = [
  "Could benefit from more cloud infrastructure experience",
  "Limited experience with enterprise-scale systems",
  "May need onboarding for specific tech stack",
  "Gaps in certain required technologies",
  "Would benefit from more leadership experience"
]

const experienceAlignments = [
  "Candidate has 5+ years of directly relevant experience in similar roles, with strong overlap in required technologies and domain knowledge.",
  "Strong alignment with 4 years in the field. Has worked on similar projects and understands the problem domain well.",
  "Moderate alignment with relevant background. Some experience gaps but shows potential for quick learning.",
  "Partial alignment with transferable skills from adjacent field. Would require additional training.",
]

function getRandomItems<T>(array: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

function getVerdict(matchPercentage: number): "STRONG MATCH" | "GOOD MATCH" | "WEAK MATCH" {
  if (matchPercentage >= 80) return "STRONG MATCH"
  if (matchPercentage >= 60) return "GOOD MATCH"
  return "WEAK MATCH"
}

function getRecommendation(atsScore: number): "Highly Recommended" | "Recommended" | "Consider" | "Not Recommended" {
  if (atsScore >= 85) return "Highly Recommended"
  if (atsScore >= 70) return "Recommended"
  if (atsScore >= 50) return "Consider"
  return "Not Recommended"
}

export function generateMockCandidates(files: File[]): CandidateData[] {
  return files
    .map((file, index) => {
      // Generate scores with some randomness but generally decreasing by rank
      const baseScore = 95 - (index * 8) + (Math.random() * 10 - 5)
      const matchPercentage = Math.min(98, Math.max(35, Math.round(baseScore)))
      const atsScore = Math.min(99, Math.max(30, Math.round(baseScore + (Math.random() * 10 - 5))))

      return {
        id: `candidate-${index + 1}`,
        rank: index + 1,
        filename: file.name,
        matchPercentage,
        atsScore,
        verdict: getVerdict(matchPercentage),
        matchedSkills: getRandomItems(skillsPool, 4, 8),
        missingSkills: getRandomItems(missingSkillsPool, 1, 4),
        experienceAlignment: experienceAlignments[Math.min(index, experienceAlignments.length - 1)],
        strengths: getRandomItems(strengthsPool, 3, 5),
        improvements: getRandomItems(improvementsPool, 2, 3),
        interviewRecommendation: getRecommendation(atsScore),
        atsBreakdown: {
          skillsMatch: Math.min(100, Math.max(40, Math.round(matchPercentage + (Math.random() * 15 - 7)))),
          experienceMatch: Math.min(100, Math.max(35, Math.round(matchPercentage + (Math.random() * 20 - 10)))),
          educationMatch: Math.min(100, Math.max(50, Math.round(matchPercentage + (Math.random() * 10 - 5)))),
          keywordDensity: Math.min(100, Math.max(30, Math.round(atsScore + (Math.random() * 15 - 7)))),
        },
      }
    })
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }))
}
