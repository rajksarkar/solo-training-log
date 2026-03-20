import SwiftUI

struct SignupView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @Environment(\.dismiss) var dismiss
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""

    private var isValid: Bool {
        !name.isEmpty && !email.isEmpty && password.count >= 8 && password == confirmPassword
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.Colors.surface.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 16) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Name")
                                .font(Theme.Fonts.labelMedium)
                                .foregroundStyle(Theme.Colors.onSurfaceVariant)
                            TextField("Your name", text: $name)
                                .textFieldStyle(AppTextFieldStyle())
                                .textContentType(.name)
                        }

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
                            SecureField("Min 8 characters", text: $password)
                                .textFieldStyle(AppTextFieldStyle())
                                .textContentType(.newPassword)
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            Text("Confirm Password")
                                .font(Theme.Fonts.labelMedium)
                                .foregroundStyle(Theme.Colors.onSurfaceVariant)
                            SecureField("Confirm password", text: $confirmPassword)
                                .textFieldStyle(AppTextFieldStyle())
                                .textContentType(.newPassword)
                            if !confirmPassword.isEmpty && password != confirmPassword {
                                Text("Passwords don't match")
                                    .font(Theme.Fonts.bodySmall)
                                    .foregroundStyle(Theme.Colors.error)
                            }
                        }

                        if let error = authViewModel.errorMessage {
                            Text(error)
                                .font(Theme.Fonts.bodySmall)
                                .foregroundStyle(Theme.Colors.error)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }

                        Button {
                            Task {
                                await authViewModel.signup(name: name, email: email, password: password)
                                if authViewModel.isAuthenticated { dismiss() }
                            }
                        } label: {
                            Group {
                                if authViewModel.isLoading {
                                    ProgressView().tint(.white)
                                } else {
                                    Text("Create Account")
                                }
                            }
                            .font(Theme.Fonts.labelLarge)
                            .foregroundStyle(Theme.Colors.onPrimary)
                            .frame(maxWidth: .infinity)
                            .frame(height: 48)
                            .background(Theme.Colors.primary)
                            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.xl))
                        }
                        .disabled(!isValid || authViewModel.isLoading)
                        .opacity(!isValid ? 0.5 : 1)
                    }
                    .padding(24)
                }
            }
            .navigationTitle("Sign Up")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(Theme.Colors.primary)
                }
            }
        }
    }
}
