import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Mail, Lock, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShaderBackground } from "@/components/ui/shader-background";

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
    if (error.includes("weak_password")) return "Senha muito fraca. Escolha uma senha mais complexa.";
    if (error.includes("too many requests")) return "Muitas tentativas. Tente novamente mais tarde.";
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
            user_id: data.user.id,
            email,
            company_name: companyName,
          });
          
        if (profileError) console.error("Error creating profile:", profileError);
        toast.success("Conta criada com sucesso! Redirecionando...");
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
    <div className="flex min-h-screen items-center justify-center p-4 font-sans selection:bg-orange-500/30">
      <ShaderBackground />
      
      <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] -z-10" />

      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-700 relative z-10">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-500 shadow-[0_0_50px_rgba(249,115,22,0.4)] border border-orange-400/50">
            <span className="text-3xl font-black text-white tracking-tighter italic">JTD</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white mb-3 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent italic uppercase">
            JTD Motors Hub
          </h1>
          <p className="text-neutral-400 text-xs font-bold uppercase tracking-[0.3em] opacity-80">
            Gestão inteligente para vendedores
          </p>
        </div>

        <div className="overflow-hidden rounded-[2.5rem] border border-neutral-800/50 bg-neutral-900/40 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.5)]">
          <div className="flex border-b border-neutral-800/50 p-2">
            <button
              onClick={() => { setActiveTab("login"); setErrors({}); }}
              className={cn(
                "flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all rounded-[1.5rem]",
                activeTab === "login" 
                  ? "bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.2)]" 
                  : "text-neutral-500 hover:text-neutral-300"
              )}
            >
              Entrar
            </button>
            <button
              onClick={() => { setActiveTab("signup"); setErrors({}); }}
              className={cn(
                "flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all rounded-[1.5rem]",
                activeTab === "signup" 
                  ? "bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.2)]" 
                  : "text-neutral-500 hover:text-neutral-300"
              )}
            >
              Criar conta
            </button>
          </div>

          <div className="p-10">
            <form onSubmit={activeTab === "login" ? handleLogin : handleSignUp} className="space-y-6">
              {activeTab === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Nome da empresa</Label>
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 group-focus-within:text-orange-500 transition-colors" />
                    <input
                      id="companyName"
                      placeholder="Ex: JTD Motors"
                      className={cn(
                        "w-full h-14 bg-black/40 border border-neutral-700/60 rounded-[1.25rem] pl-12 pr-4 text-white placeholder:text-neutral-600 text-sm focus:outline-none focus:border-orange-500/60 focus:shadow-[0_0_20px_rgba(249,115,22,0.15)] transition-all",
                        errors.companyName && "border-red-500/50 bg-red-500/5"
                      )}
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  {errors.companyName && <p className="text-[10px] font-bold text-red-400 ml-1">{errors.companyName}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    id="email"
                    type="email"
                    placeholder="voce@exemplo.com"
                    className={cn(
                      "w-full h-14 bg-black/40 border border-neutral-700/60 rounded-[1.25rem] pl-12 pr-4 text-white placeholder:text-neutral-600 text-sm focus:outline-none focus:border-orange-500/60 focus:shadow-[0_0_20px_rgba(249,115,22,0.15)] transition-all",
                      errors.email && "border-red-500/50 bg-red-500/5"
                    )}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {errors.email && <p className="text-[10px] font-bold text-red-400 ml-1">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Senha</Label>
                  {activeTab === "login" && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[10px] font-bold text-orange-500 hover:text-orange-400 transition-colors uppercase tracking-widest"
                    >
                      Esqueci minha senha
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={cn(
                      "w-full h-14 bg-black/40 border border-neutral-700/60 rounded-[1.25rem] pl-12 pr-12 text-white placeholder:text-neutral-600 text-sm focus:outline-none focus:border-orange-500/60 focus:shadow-[0_0_20px_rgba(249,115,22,0.15)] transition-all",
                      errors.password && "border-red-500/50 bg-red-500/5"
                    )}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-[10px] font-bold text-red-400 ml-1">{errors.password}</p>}
              </div>

              {activeTab === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Confirmar senha</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 group-focus-within:text-orange-500 transition-colors" />
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={cn(
                        "w-full h-14 bg-black/40 border border-neutral-700/60 rounded-[1.25rem] pl-12 pr-4 text-white placeholder:text-neutral-600 text-sm focus:outline-none focus:border-orange-500/60 focus:shadow-[0_0_20px_rgba(249,115,22,0.15)] transition-all",
                        errors.confirmPassword && "border-red-500/50 bg-red-500/5"
                      )}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-[10px] font-bold text-red-400 ml-1">{errors.confirmPassword}</p>}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-16 bg-orange-500 hover:bg-orange-400 text-white font-black uppercase tracking-[0.2em] rounded-[1.5rem] shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:shadow-[0_0_40px_rgba(249,115,22,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : activeTab === "login" ? (
                  "Entrar"
                ) : (
                  "Criar conta"
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              {activeTab === "login" ? (
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                  Não tem conta?{" "}
                  <button
                    onClick={() => { setActiveTab("signup"); setErrors({}); }}
                    className="text-orange-500 hover:text-orange-400 transition-colors"
                  >
                    Criar agora
                  </button>
                </p>
              ) : (
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                  Já tem conta?{" "}
                  <button
                    onClick={() => { setActiveTab("login"); setErrors({}); }}
                    className="text-orange-500 hover:text-orange-400 transition-colors"
                  >
                    Fazer login
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
