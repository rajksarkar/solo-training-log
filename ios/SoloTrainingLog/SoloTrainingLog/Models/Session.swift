import Foundation

struct Session: Codable, Identifiable {
    let id: String
    let ownerId: String
    let title: String
    let category: ExerciseCategory
    let date: String
    let notes: String?
    let templateId: String?
    let createdAt: String
    let exercises: [SessionExercise]?
}

struct SessionExercise: Codable, Identifiable {
    let id: String
    let sessionId: String
    let exerciseId: String
    let order: Int
    let notes: String?
    let exercise: Exercise?
    let setLogs: [SetLog]?
}

struct CreateSessionRequest: Codable {
    let title: String
    let category: String
    let date: String
    var notes: String?
    var templateId: String?
}

struct AddSessionExerciseRequest: Codable {
    let exerciseId: String
    let order: Int
    var notes: String?
}
