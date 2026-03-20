import Foundation

struct SessionTemplate: Codable, Identifiable, Hashable {
    static func == (lhs: SessionTemplate, rhs: SessionTemplate) -> Bool { lhs.id == rhs.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
    let id: String
    let ownerId: String
    let title: String
    let category: ExerciseCategory
    let notes: String?
    let createdAt: String
    let exercises: [TemplateExercise]?
}

struct TemplateExercise: Codable, Identifiable {
    let id: String
    let templateId: String
    let exerciseId: String
    let order: Int
    let defaultSets: Int?
    let defaultReps: Int?
    let defaultWeight: Double?
    let defaultDurationSec: Int?
    let exercise: Exercise?
}

struct CreateTemplateRequest: Codable {
    let title: String
    let category: String
    var notes: String?
}

struct AddTemplateExerciseRequest: Codable {
    let exerciseId: String
    let order: Int
    var defaultSets: Int?
    var defaultReps: Int?
    var defaultWeight: Double?
    var defaultDurationSec: Int?
}
