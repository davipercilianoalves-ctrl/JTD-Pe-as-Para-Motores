import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Mail, Lock, Building2, User, Check, X } from "lucide-react";
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
  
  console.log("AuthScreen montado, supabase:", !!supabase);
  
  const getPasswordStrength = (pwd: string) => {
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      symbol: /[^A-Za-z0-9]/.test(pwd),
    };
    const score = Object.values(checks).filter(Boolean).length;
    return { checks, score };
  };

  const translateError = (error: string) => {
    if (error.includes("Invalid login credentials")) return "Email ou senha incorretos";
    if (error.includes("Email not confirmed")) return "Confirme seu email antes de entrar";
    if (error.includes("User already registered")) return "Este email já está cadastrado";
    if (error.includes("Password should be at least")) return "A senha deve ter pelo menos 8 caracteres";
    return "Erro ao processar. Tente novamente.";
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!email.trim()) newErrors.email = "Campo obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      newErrors.email = "Email inválido";
    
    if (!password) newErrors.password = "Campo obrigatório";
    else if (password.length < 8)
      newErrors.password = "Mínimo 8 caracteres";
    
    if (activeTab === "signup") {
      if (!companyName.trim())
        newErrors.companyName = "Campo obrigatório";
      if (!confirmPassword)
        newErrors.confirmPassword = "Campo obrigatório";
      else if (confirmPassword !== password)
        newErrors.confirmPassword = "As senhas não coincidem";
      
      const { score } = getPasswordStrength(password);
      if (score < 5)
        newErrors.password = "Complete todos os requisitos de senha";
    }
    
    console.log("validate resultado:", { newErrors, temErros: Object.keys(newErrors).length > 0 });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    console.log("handleLogin iniciado");
    
    if (!validate()) {
      console.log("validação falhou");
      return;
    }
    
    setLoading(true);
    console.log("chamando supabase.auth.signInWithPassword");
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      console.log("resposta supabase:", { data, error });
      
      if (error) {
        toast.error(translateError(error.message));
        return;
      }
      
      console.log("login bem sucedido", data);
      
    } catch (err: any) {
      console.error("erro catch:", err);
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    console.log("handleSignUp iniciado");
    
    if (!validate()) {
      console.log("validação falhou", errors);
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { company_name: companyName }
        }
      });
      
      console.log("resposta signup:", { data, error });
      
      if (error) {
        toast.error(translateError(error.message));
        return;
      }
      
      if (data.user) {
        try {
          await supabase
            .from("profiles")
            .upsert({
              id: data.user.id,
              user_id: data.user.id,
              email: email.trim(),
              company_name: companyName,
            });
        } catch (profileErr) {
          console.error("erro ao criar perfil:", profileErr);
        }
        
        toast.success("Conta criada com sucesso!");
      }
      
    } catch (err: any) {
      console.error("erro catch:", err);
      toast.error("Erro de conexão. Tente novamente.");
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
                
                {activeTab === "signup" && password.length > 0 && (
                  <div className="mt-4 space-y-3 rounded-lg bg-white/5 p-4 border border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-bold text-white/70 uppercase tracking-wider">
                        Requisitos da senha:
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { key: "length", label: "Mínimo 8 caracteres" },
                        { key: "uppercase", label: "Uma letra maiúscula" },
                        { key: "lowercase", label: "Uma letra minúscula" },
                        { key: "number", label: "Um número" },
                        { key: "symbol", label: "Um símbolo (!@#$%...)" },
                      ].map(({ key, label }) => {
                        const ok = getPasswordStrength(password).checks[key as keyof ReturnType<typeof getPasswordStrength>["checks"]];
                        return (
                          <div key={key} className="flex items-center gap-2">
                            <div className={cn(
                              "flex h-4 w-4 items-center justify-center rounded-full border transition-colors",
                              ok ? "bg-green-500/20 border-green-500/50" : "bg-white/5 border-white/10"
                            )}>
                              {ok ? (
                                <Check className="h-2.5 w-2.5 text-green-500" />
                              ) : (
                                <div className="h-1 w-1 rounded-full bg-white/20" />
                              )}
                            </div>
                            <span className={cn(
                              "text-xs transition-colors",
                              ok ? "text-green-400" : "text-muted-foreground"
                            )}>
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-white/5 mt-2">
                      <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((level) => {
                          const score = getPasswordStrength(password).score;
                          const color =
                            score <= 2 ? "bg-red-500" :
                            score === 3 ? "bg-yellow-500" :
                            score === 4 ? "bg-blue-500" :
                            "bg-green-500";
                          return (
                            <div
                              key={level}
                              className={cn(
                                "h-1 flex-1 rounded-full transition-all duration-500",
                                level <= score ? color : "bg-white/10"
                              )}
                            />
                          );
                        })}
                      </div>
                      <p className={cn(
                        "text-[10px] font-bold uppercase tracking-widest text-right",
                        getPasswordStrength(password).score <= 2 ? "text-red-400" :
                        getPasswordStrength(password).score === 3 ? "text-yellow-400" :
                        getPasswordStrength(password).score === 4 ? "text-blue-400" :
                        "text-green-400"
                      )}>
                        {getPasswordStrength(password).score <= 2
                          ? "Senha fraca"
                          : getPasswordStrength(password).score === 3
                            ? "Senha razoável"
                            : getPasswordStrength(password).score === 4
                              ? "Senha boa"
                              : "Senha forte ✓"}
                      </p>
                    </div>
                  </div>
                )}
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
