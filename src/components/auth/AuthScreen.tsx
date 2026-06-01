import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Mail, Lock, Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthTab = "login" | "signup";

export function AuthScreen() {
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  
  // Error states
  const [errors, setErrors] = useState<Record<string, string>>({});

  const translateError = (error: string) => {
    if (error.includes("Invalid login credentials")) return "Email ou senha incorretos";
    if (error.includes("Email not confirmed")) return "Confirme seu email antes de entrar";
    if (error.includes("User already registered")) return "Este email já está cadastrado";
    if (error.includes("Password should be at least")) return "A senha deve ter pelo menos 8 caracteres";
    return "Erro ao processar. Tente novamente.";
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!email) newErrors.email = "Campo obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Email inválido";
    
    if (!password) newErrors.password = "Campo obrigatório";
    else if (password.length < 8) newErrors.password = "Mínimo 8 caracteres";
    
    if (activeTab === "signup") {
      if (!companyName) newErrors.companyName = "Campo obrigatório";
      if (!confirmPassword) newErrors.confirmPassword = "Campo obrigatório";
      else if (confirmPassword !== password) newErrors.confirmPassword = "As senhas não coincidem";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(translateError(error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (signUpError) throw signUpError;
      
      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            email,
            company_name: companyName,
          });
          
        if (profileError) console.error("Error creating profile:", profileError);
        toast.success("Conta criada! Verifique seu email para confirmar.");
      }
    } catch (error: any) {
      toast.error(translateError(error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrors({ email: "Digite seu email para recuperar a senha" });
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast.success("Email de recuperação enviado!");
    } catch (error: any) {
      toast.error(translateError(error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4 font-sans text-white">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.1)]">
            <span className="text-2xl font-bold text-primary tracking-tighter">JTD</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">JTD Motors Hub</h1>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">
            Gestão inteligente para vendedores
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-2xl">
          <div className="flex border-b border-white/5 bg-white/5">
            <button
              onClick={() => { setActiveTab("login"); setErrors({}); }}
              className={cn(
                "flex-1 py-4 text-sm font-semibold transition-all",
                activeTab === "login" 
                  ? "bg-[#141414] text-primary" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              Entrar
            </button>
            <button
              onClick={() => { setActiveTab("signup"); setErrors({}); }}
              className={cn(
                "flex-1 py-4 text-sm font-semibold transition-all",
                activeTab === "signup" 
                  ? "bg-[#141414] text-primary" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              Criar conta
            </button>
          </div>

          <div className="p-8">
            <form onSubmit={activeTab === "login" ? handleLogin : handleSignUp} className="space-y-5">
              {activeTab === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da empresa</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyName"
                      placeholder="Ex: JTD Motors"
                      className={cn("pl-10 h-11 bg-white/5 border-white/10 focus:border-primary", errors.companyName && "border-destructive")}
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  {errors.companyName && <p className="text-xs font-medium text-destructive">{errors.companyName}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="voce@exemplo.com"
                    className={cn("pl-10 h-11 bg-white/5 border-white/10 focus:border-primary", errors.email && "border-destructive")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {errors.email && <p className="text-xs font-medium text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  {activeTab === "login" && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={cn("pl-10 pr-10 h-11 bg-white/5 border-white/10 focus:border-primary", errors.password && "border-destructive")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs font-medium text-destructive">{errors.password}</p>}
              </div>

              {activeTab === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={cn("pl-10 h-11 bg-white/5 border-white/10 focus:border-primary", errors.confirmPassword && "border-destructive")}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-xs font-medium text-destructive">{errors.confirmPassword}</p>}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : activeTab === "login" ? (
                  "Entrar"
                ) : (
                  "Criar conta"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              {activeTab === "login" ? (
                <p className="text-sm text-muted-foreground">
                  Não tem conta?{" "}
                  <button
                    onClick={() => { setActiveTab("signup"); setErrors({}); }}
                    className="font-semibold text-primary hover:underline"
                  >
                    Criar conta
                  </button>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Já tem conta?{" "}
                  <button
                    onClick={() => { setActiveTab("login"); setErrors({}); }}
                    className="font-semibold text-primary hover:underline"
                  >
                    Entrar
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
