import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var email = ""
    @State private var password = ""
    @State private var showSignup = false

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.Colors.surface.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 32) {
                        // Header
                        VStack(spacing: 8) {
                            Image(systemName: "figure.strengthtraining.traditional")
                                .font(.system(size: 40))
                                .foregroundStyle(Theme.Colors.primary)
                            Text("Solo Training Log")
                                .font(Theme.Fonts.displayLarge)
                                .foregroundStyle(Theme.Colors.onSurface)
                            Text("Log your workouts, track your progress")
                                .font(Theme.Fonts.bodyMedium)
                                .foregroundStyle(Theme.Colors.onSurfaceVariant)
                        }
                        .padding(.top, 60)

                        // Form
                        VStack(spacing: 16) {
                            VStack(alignment: .leading, spacing: 6) {
                                Text("Email")
                                    .font(Theme.Fonts.labelMedium)
                                    .foregroundStyle(Theme.Colors.onSurfaceVariant)
                                TextField("you@example.com", text: $email)
                                    .textFieldStyle(AppTextFieldStyle())
                                    .textContentType(.emailAddress)
                                    .keyboardType(.emailAddress)
                                    .autocapitalization(.none)
                                    .autocorrectionDisabled()
                            }

                            VStack(alignment: .leading, spacing: 6) {
                                Text("Password")
                                    .font(Theme.Fonts.labelMedium)
                                    .foregroundStyle(Theme.Colors.onSurfaceVariant)
                                SecureField("Password", text: $password)
                                    .textFieldStyle(AppTextFieldStyle())
                                    .textContentType(.password)
                            }

                            if let error = authViewModel.errorMessage {
                                Text(error)
                                    .font(Theme.Fonts.bodySmall)
                                    .foregroundStyle(Theme.Colors.error)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }

                            Button {
                                Task { await authViewModel.login(email: email, password: password) }
                            } label: {
                                Group {
                                    if authViewModel.isLoading {
                                        ProgressView()
                                            .tint(.white)
                                    } else {
                                        Text("Sign In")
                                    }
                                }
                                .font(Theme.Fonts.labelLarge)
                                .foregroundStyle(Theme.Colors.onPrimary)
                                .frame(maxWidth: .infinity)
                                .frame(height: 48)
                                .background(Theme.Colors.primary)
                                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.xl))
                            }
                            .disabled(email.isEmpty || password.isEmpty || authViewModel.isLoading)
                            .opacity(email.isEmpty || password.isEmpty ? 0.5 : 1)
                        }
                        .padding(24)
                        .background(Theme.Colors.surfaceContainerLowest)
                        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
                        .shadow(color: Color(hex: "#1a2c22").opacity(0.06), radius: 1.5, y: 1)

                        // Sign up link
                        Button {
                            showSignup = true
                        } label: {
                            HStack(spacing: 4) {
                                Text("Don't have an account?")
                                    .foregroundStyle(Theme.Colors.onSurfaceVariant)
                                Text("Sign Up")
                                    .foregroundStyle(Theme.Colors.primary)
                                    .fontWeight(.semibold)
                            }
                            .font(Theme.Fonts.bodySmall)
                        }
                    }
                    .padding(.horizontal, 24)
                }
            }
            .sheet(isPresented: $showSignup) {
                SignupView()
                    .environmentObject(authViewModel)
            }
        }
    }
}

// MARK: - App Text Field Style

struct AppTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding(.horizontal, 16)
            .frame(height: 48)
            .background(Theme.Colors.surfaceContainerLowest)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.sm)
                    .stroke(Theme.Colors.outlineVariant.opacity(0.6), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.sm))
            .font(Theme.Fonts.bodyMedium)
    }
}
