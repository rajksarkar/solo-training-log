import SwiftUI

@main
struct SoloTrainingLogApp: App {
    @StateObject private var authViewModel = AuthViewModel()

    var body: some Scene {
        WindowGroup {
            Group {
                if authViewModel.isCheckingAuth {
                    LaunchScreenView()
                } else if authViewModel.isAuthenticated {
                    MainTabView()
                        .environmentObject(authViewModel)
                } else {
                    LoginView()
                        .environmentObject(authViewModel)
                }
            }
            .animation(.easeInOut(duration: 0.3), value: authViewModel.isAuthenticated)
            .animation(.easeInOut(duration: 0.3), value: authViewModel.isCheckingAuth)
        }
    }
}

struct LaunchScreenView: View {
    var body: some View {
        ZStack {
            Theme.Colors.surface.ignoresSafeArea()
            VStack(spacing: 16) {
                Image(systemName: "figure.strengthtraining.traditional")
                    .font(.system(size: 48))
                    .foregroundStyle(Theme.Colors.primary)
                Text("Solo Training Log")
                    .font(Theme.Fonts.displayLarge)
                    .foregroundStyle(Theme.Colors.onSurface)
            }
        }
    }
}
