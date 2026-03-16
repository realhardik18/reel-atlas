import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <SignUp
        fallbackRedirectUrl="/dashboard"
        appearance={{
          baseTheme: dark,
          variables: {
            colorPrimary: "#27272a",
            colorText: "#ffffff",
            colorTextSecondary: "#a1a1aa",
            colorTextOnPrimaryBackground: "#ffffff",
            colorBackground: "#141414",
            colorInputBackground: "#1e1e1e",
            colorInputText: "#ffffff",
            colorNeutral: "#ffffff",
          },
          elements: {
            card: {
              border: "1px solid #27272a",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
            },
            cardBox: {
              boxShadow: "none",
            },
            formButtonPrimary: {
              backgroundColor: "#27272a",
              color: "#ffffff",
              border: "1px solid #3f3f46",
            },
            formFieldInput: {
              backgroundColor: "#1e1e1e",
              borderColor: "#3f3f46",
              color: "#ffffff",
            },
            socialButtonsBlockButton: {
              backgroundColor: "#1e1e1e",
              borderColor: "#3f3f46",
              color: "#ffffff",
            },
            footer: {
              background: "#141414",
              borderTop: "none",
            },
            footerAction: {
              border: "none",
            },
            footerActionLink: {
              color: "#ffffff",
            },
            footerPages: {
              border: "none",
            },
            footerPagesLink: {
              color: "#a1a1aa",
            },
            dividerLine: {
              borderColor: "#27272a",
            },
            dividerText: {
              color: "#a1a1aa",
            },
            headerTitle: {
              color: "#ffffff",
            },
            headerSubtitle: {
              color: "#a1a1aa",
            },
            formFieldLabel: {
              color: "#ffffff",
            },
            formFieldHintText: {
              color: "#a1a1aa",
            },
            formFieldInputPlaceholder: {
              color: "#71717a",
            },
            formFieldErrorText: {
              color: "#ef4444",
            },
            formFieldSuccessText: {
              color: "#22c55e",
            },
            badge: {
              color: "#ffffff",
              backgroundColor: "#27272a",
              borderColor: "#3f3f46",
            },
            socialButtonsBlockButtonText: {
              color: "#ffffff",
            },
          },
        }}
      />
    </div>
  );
}
