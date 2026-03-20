import Foundation

enum APIError: LocalizedError {
    case invalidURL
    case unauthorized
    case badRequest(String)
    case serverError(Int)
    case decodingError(Error)
    case networkError(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid URL"
        case .unauthorized: return "Please log in again"
        case .badRequest(let msg): return msg
        case .serverError(let code): return "Server error (\(code))"
        case .decodingError(let err): return "Data error: \(err.localizedDescription)"
        case .networkError(let err): return err.localizedDescription
        }
    }
}

actor APIClient {
    static let shared = APIClient()

    // MARK: - Configuration
    private let baseURL = "https://solo-training-log.vercel.app"

    private var token: String? {
        KeychainService.getToken()
    }

    // MARK: - Core Request

    func request<T: Decodable>(
        _ endpoint: String,
        method: String = "GET",
        body: (any Encodable)? = nil,
        queryItems: [URLQueryItem]? = nil
    ) async throws -> T {
        guard var components = URLComponents(string: "\(baseURL)\(endpoint)") else {
            throw APIError.invalidURL
        }
        if let queryItems {
            components.queryItems = queryItems
        }
        guard let url = components.url else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body {
            let encoder = JSONEncoder()
            request.httpBody = try encoder.encode(body)
        }

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            throw APIError.networkError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.serverError(0)
        }

        switch httpResponse.statusCode {
        case 200...299:
            break
        case 401:
            throw APIError.unauthorized
        case 400...499:
            if let errorBody = try? JSONDecoder().decode(ErrorResponse.self, from: data) {
                throw APIError.badRequest(errorBody.error)
            }
            throw APIError.badRequest("Request failed")
        default:
            throw APIError.serverError(httpResponse.statusCode)
        }

        do {
            let decoder = JSONDecoder()
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }

    // Fire-and-forget for DELETE etc.
    func request(
        _ endpoint: String,
        method: String = "DELETE"
    ) async throws {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            throw APIError.networkError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.serverError(0)
        }

        if httpResponse.statusCode == 401 {
            throw APIError.unauthorized
        }
        if httpResponse.statusCode >= 400 {
            if let errorBody = try? JSONDecoder().decode(ErrorResponse.self, from: data) {
                throw APIError.badRequest(errorBody.error)
            }
            throw APIError.serverError(httpResponse.statusCode)
        }
    }
}

private struct ErrorResponse: Codable {
    let error: String
}
