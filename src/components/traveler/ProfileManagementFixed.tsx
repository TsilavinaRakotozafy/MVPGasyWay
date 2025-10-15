import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../ui/avatar";
import { Badge } from "../ui/badge";
import { toast } from "sonner@2.0.3";
import {
  User,
  Mail,
  Phone,
  Upload,
  Save,
  Heart,
  X,
  Loader2,
  Camera,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContextSQL";
import { supabase } from "../../utils/supabase/client";
import { InterestSelectorSQL } from "./InterestSelectorSQL";
import { PhoneInput } from "../common/PhoneInput";

import {
  compressImageToWebP,
  validateImageFile,
  generateImageFileName,
  createImagePreview,
  extractFilePathFromUrl,
  PROFILE_PICTURE_CONFIG,
  ImageCompressionOptions,
} from "../../utils/imageCompression";

export function ProfileManagementFixed() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(
    null,
  );

  // 📊 Configuration simple de qualité d'image (sans hooks pour éviter les erreurs)
  const [finalQualityConfig, setFinalQualityConfig] =
    useState<ImageCompressionOptions>(PROFILE_PICTURE_CONFIG);

  // 🎯 Calculer la qualité optimale selon la taille du fichier (version simplifiée)
  const getOptimalQuality = (
    fileSizeKB: number,
  ): ImageCompressionOptions => {
    // Configuration adaptative simple
    if (fileSizeKB > 5000) {
      // Fichier très lourd - compression agressive
      return {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.8,
        maxSizeKB: 200,
      };
    } else if (fileSizeKB > 2000) {
      // Fichier lourd - compression modérée
      return {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.85,
        maxSizeKB: 250,
      };
    } else {
      // Fichier normal - compression douce
      return {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.9,
        maxSizeKB: 200,
      };
    }
  };

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    phoneCountryCode: "+261",
    phoneNumber: "",
    profile_picture_url: "",
    bio: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>(
    {},
  );
  const [syncing, setSyncing] = useState(false);

  // ✅ Force refresh avec une clé pour forcer la mise à jour du PhoneInput
  const [phoneKey, setPhoneKey] = useState(Date.now());

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) {
      console.log(
        "🚫 loadProfileData: user est null ou undefined",
      );
      return;
    }

    try {
      console.log(
        "🔄 Chargement données profil depuis table users unifiée",
      );
      console.log("📋 User object reçu du contexte:", {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        bio: user.bio,
        profile_picture_url: user.profile_picture_url,
        role: user.role,
        status: user.status,
      });

      // 🔄 CORRECTION: Charger les données directement depuis Supabase pour avoir les données les plus récentes
      console.log(
        "🔍 Récupération des données fraîches depuis Supabase...",
      );
      const { data: freshUserData, error: fetchError } =
        await supabase
          .from("users")
          .select(
            "first_name, last_name, phone, bio, profile_picture_url",
          )
          .eq("id", user.id)
          .single();

      if (fetchError) {
        console.warn(
          "⚠️ Erreur récupération données fraîches, utilisation du contexte:",
          fetchError.message,
        );
        // Fallback vers les données du contexte si erreur
      } else {
        console.log(
          "✅ Données fraîches récupérées:",
          freshUserData,
        );
      }

      // Utiliser les données fraîches si disponibles, sinon fallback vers le contexte
      const dataSource = freshUserData || user;
      const existingPhone = dataSource.phone || "";
      let phoneCountryCode = "+261";
      let phoneNumber = "";

      console.log("📞 Processing phone:", existingPhone);

      // Séparer le code pays et le numéro si un téléphone existe
      if (existingPhone && typeof existingPhone === "string") {
        const phoneMatch = existingPhone.match(
          /^(\+\d{1,4})\s*(.*)$/,
        );
        if (phoneMatch) {
          phoneCountryCode = phoneMatch[1];
          phoneNumber = phoneMatch[2].trim();
          console.log("📞 Phone parsed:", {
            phoneCountryCode,
            phoneNumber,
          });
        } else {
          phoneNumber = existingPhone;
          console.log("📞 Phone direct:", phoneNumber);
        }
      }

      const newFormData = {
        first_name: dataSource.first_name || "",
        last_name: dataSource.last_name || "",
        phone: existingPhone,
        phoneCountryCode,
        phoneNumber,
        profile_picture_url:
          dataSource.profile_picture_url || "",
        bio: dataSource.bio || "",
      };

      console.log(
        "📝 Nouveau formData à appliquer:",
        newFormData,
      );

      setFormData(newFormData);

      // ✅ CORRECTIF: Forcer la mise à jour du PhoneInput avec une nouvelle clé
      setPhoneKey(Date.now());

      // 🔧 CORRECTION MAJEURE: Initialiser l'aperçu avec les données fraîches de Supabase
      const freshProfilePictureUrl =
        dataSource.profile_picture_url || "";
      setImagePreview(freshProfilePictureUrl);
      console.log(
        "📸 ImagePreview mis à jour avec URL fraîche:",
        freshProfilePictureUrl,
      );

      console.log(
        "✅ Données profil chargées avec données fraîches Supabase - FormData mis à jour",
      );

      // 🔍 Vérification post-mise à jour
      setTimeout(() => {
        console.log(
          "🔍 Vérification post-update formData:",
          newFormData,
        );
        console.log(
          "🔍 ImagePreview final:",
          freshProfilePictureUrl,
        );
      }, 100);
    } catch (error) {
      console.error("❌ Erreur chargement profil:", error);
      toast.error("Erreur lors du chargement du profil");
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Champs obligatoires
    if (!formData.first_name || !formData.first_name.trim()) {
      newErrors.first_name = "Prénom requis";
    }

    if (!formData.last_name || !formData.last_name.trim()) {
      newErrors.last_name = "Nom requis";
    }

    if (!formData.phoneNumber || !formData.phoneNumber.trim()) {
      newErrors.phone = "Numéro de téléphone requis";
    } else {
      // Validation du format selon le pays sélectionné
      const digitsOnly = formData.phoneNumber.replace(
        /\D/g,
        "",
      );
      if (formData.phoneCountryCode === "+261") {
        if (digitsOnly.length !== 9) {
          newErrors.phone =
            "Le numéro doit contenir exactement 9 chiffres pour Madagascar";
        }
      } else if (formData.phoneCountryCode === "+33") {
        if (digitsOnly.length !== 10) {
          newErrors.phone =
            "Le numéro doit contenir exactement 10 chiffres pour la France";
        }
      }
    }

    // Validation URL photo si fournie
    if (
      formData.profile_picture_url &&
      !formData.profile_picture_url.match(/^https?:\/\/.+/)
    ) {
      newErrors.profile_picture_url = "URL d'image invalide";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 📱 Gestionnaire pour le composant PhoneInput
  const handlePhoneChange = (phoneData: {
    countryCode: string;
    phoneNumber: string;
  }) => {
    console.log("📞 PhoneInput changé:", phoneData);
    setFormData((prev) => ({
      ...prev,
      phoneCountryCode: phoneData.countryCode,
      phoneNumber: phoneData.phoneNumber,
      phone:
        `${phoneData.countryCode} ${phoneData.phoneNumber}`.trim(),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(
        "Veuillez corriger les erreurs du formulaire",
      );
      return;
    }

    if (!user?.id) {
      toast.error("Utilisateur non trouvé");
      return;
    }

    setSaving(true);

    try {
      console.log(
        "🔄 Mise à jour profil dans table users unifiée",
      );

      const completePhoneNumber =
        `${formData.phoneCountryCode} ${formData.phoneNumber}`.trim();

      const { error } = await supabase
        .from("users")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: completePhoneNumber,
          profile_picture_url:
            formData.profile_picture_url || null,
          bio: formData.bio || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      console.log(
        "✅ Profil mis à jour dans table users unifiée",
      );
      toast.success("Profil mis à jour avec succès !");

      // Rafraîchir les données utilisateur dans le contexte
      await refreshUser();
    } catch (error: any) {
      console.error("❌ Erreur mise à jour profil:", error);
      toast.error(
        error.message ||
          "Erreur lors de la mise à jour du profil",
      );
    } finally {
      setSaving(false);
    }
  };

  // 🔧 Fonction de synchronisation pour créer l'utilisateur dans la table users
  const syncUserToDatabase = async () => {
    if (!user?.id || !user?.email) {
      toast.error(
        "Données utilisateur insuffisantes pour la synchronisation",
      );
      return;
    }

    setSyncing(true);

    try {
      console.log(
        "🔄 Synchronisation utilisateur vers table users...",
      );

      // 1. Vérifier si l'utilisateur existe déjà
      const { data: existingUser, error: checkError } =
        await supabase
          .from("users")
          .select("id, email, first_name, last_name")
          .eq("id", user.id)
          .maybeSingle();

      if (checkError) {
        throw new Error(
          `Erreur vérification: ${checkError.message}`,
        );
      }

      if (existingUser) {
        console.log(
          "✅ Utilisateur trouvé dans la table users:",
          existingUser,
        );
        toast.info(
          "L'utilisateur existe déjà dans la table users",
        );

        // Recharger les données
        await loadProfileData();
        await refreshUser();
        return;
      }

      // 2. Créer l'utilisateur dans la table users
      console.log(
        "🆕 Création utilisateur dans table users...",
      );

      const { error: insertError } = await supabase
        .from("users")
        .insert({
          id: user.id,
          email: user.email,
          status: "active",
          role: "voyageur",
          first_name: null, // À remplir par l'utilisateur
          last_name: null, // À remplir par l'utilisateur
          phone: null,
          bio: null,
          profile_picture_url: null,
          first_login_completed: false,
          gdpr_consent: true,
          locale: "fr",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
        });

      if (insertError) {
        throw new Error(
          `Erreur création: ${insertError.message}`,
        );
      }

      console.log("✅ Utilisateur créé dans la table users");
      toast.success(
        "Utilisateur synchronisé ! Vous pouvez maintenant remplir vos informations.",
      );

      // 3. Recharger les données
      await loadProfileData();
      await refreshUser();
    } catch (error: any) {
      console.error("❌ Erreur synchronisation:", error);
      toast.error(
        error.message || "Erreur lors de la synchronisation",
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!user?.id) {
      toast.error("Utilisateur non trouvé");
      return;
    }

    setUploadingImage(true);
    setSelectedFile(file);

    try {
      // 1. Validation du fichier
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error || "Fichier invalide");
        return;
      }

      // 2. Calcul intelligent de la qualité selon la taille du fichier
      const fileSizeKB = file.size / 1024;
      const optimalConfig = getOptimalQuality(fileSizeKB);
      setFinalQualityConfig(optimalConfig);

      // 3. Créer un aperçu immédiat
      const preview = await createImagePreview(file);
      setImagePreview(preview);

      // 4. Compression intelligente avec qualité adaptative
      const compressionType =
        fileSizeKB > 2000
          ? "aggressive"
          : fileSizeKB > 1000
            ? "balanced"
            : "optimized";

      toast.loading(
        `Compression ${compressionType} (${Math.round((optimalConfig.quality || 0.9) * 100)}%)...`,
        { id: "image-upload" },
      );

      console.log(
        `🧠 Qualité intelligente pour ${fileSizeKB.toFixed(1)}KB:`,
        {
          context: "avatar",
          detectedSize: `${fileSizeKB.toFixed(1)}KB`,
          appliedQuality:
            Math.round((optimalConfig.quality || 0.9) * 100) +
            "%",
          targetSize: `${optimalConfig.maxSizeKB}KB`,
          dimensions: `${optimalConfig.maxWidth}x${optimalConfig.maxHeight}px`,
        },
      );

      const compressedBlob = await compressImageToWebP(
        file,
        optimalConfig,
      );

      // 5. Conversion en File pour l'upload
      const compressedFile = new File(
        [compressedBlob],
        generateImageFileName(user.id, file.name),
        {
          type: "image/webp",
        },
      );

      const originalSizeKB = file.size / 1024;
      const compressedSizeKB = compressedFile.size / 1024;
      const compressionRatio =
        ((originalSizeKB - compressedSizeKB) / originalSizeKB) *
        100;

      console.log(`🎯 Compression intelligente:`, {
        original: `${originalSizeKB.toFixed(1)}KB`,
        compressed: `${compressedSizeKB.toFixed(1)}KB`,
        saved: `${compressionRatio.toFixed(1)}%`,
        quality:
          Math.round((optimalConfig.quality || 0.9) * 100) +
          "%",
      });

      // 6. Supprimer l'ancienne image si elle existe
      if (formData.profile_picture_url) {
        const oldImagePath = extractFilePathFromUrl(
          formData.profile_picture_url,
        );
        if (oldImagePath) {
          try {
            await supabase.storage
              .from("profile-pictures")
              .remove([oldImagePath]);
            console.log("🗑️ Ancienne image supprimée");
          } catch (error) {
            console.log(
              "⚠️ Échec suppression ancienne image (normal si première fois)",
            );
          }
        }
      }

      // 7. Upload vers Supabase Storage
      toast.loading("Upload vers Supabase...", {
        id: "image-upload",
      });
      const fileName = generateImageFileName(
        user.id,
        file.name,
      );

      const { data: uploadData, error: uploadError } =
        await supabase.storage
          .from("profile-pictures")
          .upload(fileName, compressedFile, {
            cacheControl: "3600",
            upsert: false,
          });

      if (uploadError) {
        throw new Error(`Échec upload: ${uploadError.message}`);
      }

      // 8. Obtenir l'URL publique
      const {
        data: { publicUrl },
      } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(fileName);

      // 9. Mettre à jour le formulaire ET la base de données
      setFormData((prev) => ({
        ...prev,
        profile_picture_url: publicUrl,
      }));

      // 10. ✅ Mettre à jour immédiatement en base de données pour synchroniser
      try {
        const { error: updateError } = await supabase
          .from("users")
          .update({
            profile_picture_url: publicUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (updateError) {
          console.warn(
            "⚠️ Erreur mise à jour profil:",
            updateError.message,
          );
        } else {
          console.log(
            "✅ Photo mise à jour en base de données",
          );
          // 11. ✅ Rafraîchir le contexte utilisateur pour forcer l'affichage
          await refreshUser();
        }
      } catch (error) {
        console.warn(
          "⚠️ Erreur synchronisation utilisateur:",
          error,
        );
      }

      console.log("✅ Image uploadée:", publicUrl);
      toast.success(
        `Photo mise à jour ! Compression: ${compressionRatio.toFixed(1)}% (${compressedSizeKB.toFixed(1)}KB)`,
        { id: "image-upload" },
      );
    } catch (error: any) {
      console.error("❌ Erreur upload image:", error);
      toast.error(
        error.message || "Erreur lors de l'upload de l'image",
        { id: "image-upload" },
      );

      // Restaurer l'aperçu précédent en cas d'erreur
      setImagePreview(formData.profile_picture_url);
    } finally {
      setUploadingImage(false);
      setSelectedFile(null);
    }
  };

  const getInitials = () => {
    const first = formData.first_name
      ? formData.first_name.charAt(0)
      : "";
    const last = formData.last_name
      ? formData.last_name.charAt(0)
      : "";
    return `${first}${last}`.toUpperCase();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-500">
          Vous devez être connecté pour accéder à cette page
        </p>
      </div>
    );
  }

  // 🚨 Détection si l'utilisateur n'existe pas dans la table users
  const userNotInDatabase =
    user && !user.first_name && !user.last_name && !user.phone;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 🚨 Alerte si utilisateur pas dans la table users */}
      {userNotInDatabase && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-yellow-800">
                  Synchronisation requise
                </h3>
                <p className="text-yellow-700 mt-1">
                  Votre compte existe dans l'authentification
                  mais pas dans notre base de données. Cliquez
                  sur le bouton ci-dessous pour synchroniser vos
                  données.
                </p>
                <div className="mt-3">
                  <Button
                    onClick={syncUserToDatabase}
                    disabled={syncing}
                    size="sm"
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    {syncing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Synchronisation en cours...
                      </>
                    ) : (
                      "🔧 Synchroniser maintenant"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1>Mon profil</h1>
          <p className="text-muted-foreground">
            Gérez vos informations personnelles et préférences
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="personal"
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              <span>Informations</span>
            </TabsTrigger>
            <TabsTrigger
              value="interests"
              className="flex items-center gap-2"
            >
              <Heart className="h-4 w-4" />
              <span>Centres d'intérêt</span>
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              <span>Statistiques</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            {/* Informations de base */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Informations personnelles</span>
                </CardTitle>
                <CardDescription>
                  Vos informations de base et de contact
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Avatar section - Left side */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="relative inline-block">
                        <Avatar className="h-32 w-32 mx-auto">
                          <AvatarImage
                            src={
                              imagePreview ||
                              (formData.profile_picture_url
                                ? `${formData.profile_picture_url}?t=${Date.now()}`
                                : formData.profile_picture_url)
                            }
                            alt="Avatar"
                            onError={(e) => {
                              console.log(
                                "❌ Erreur chargement image:",
                                formData.profile_picture_url,
                              );
                              // Fallback si l'image ne charge pas
                              (
                                e.target as HTMLImageElement
                              ).style.display = "none";
                            }}
                            onLoad={() => {
                              console.log(
                                "✅ Image chargée:",
                                formData.profile_picture_url,
                              );
                            }}
                          />
                          <AvatarFallback className="text-xl">
                            {getInitials() || (
                              <Camera className="h-12 w-12" />
                            )}
                          </AvatarFallback>
                          {uploadingImage && (
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                              <Loader2 className="h-8 w-8 animate-spin text-white" />
                            </div>
                          )}
                        </Avatar>
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          disabled={uploadingImage}
                          className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                          onClick={() =>
                            document
                              .getElementById(
                                "avatar_file_input",
                              )
                              ?.click()
                          }
                        >
                          {uploadingImage ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Camera className="h-4 w-4" />
                          )}
                        </Button>
                        <input
                          id="avatar_file_input"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          className="hidden"
                          disabled={uploadingImage}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && !uploadingImage) {
                              handleImageUpload(file);
                            }
                          }}
                        />
                      </div>
                      <p className="text-muted-foreground mt-2">
                        {uploadingImage
                          ? "Compression intelligente..."
                          : "Cliquez sur l'icône pour changer"}
                      </p>
                      {uploadingImage && selectedFile && (
                        <div className="text-muted-foreground mt-1 space-y-1">
                          <p>🤖 WebP adaptatif</p>
                          <p className="text-xs">
                            {(selectedFile.size / 1024).toFixed(
                              1,
                            )}
                            KB → Qualité optimale
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Indicateur de qualité intelligente */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>🤖 Qualité intelligente</Label>
                        <Badge
                          variant="secondary"
                          className="text-xs"
                        >
                          Auto
                        </Badge>
                      </div>


                    </div>


                  </div>

                  {/* Form fields - Right side */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Nom et prénom */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label
                          htmlFor="first_name"
                          className="required"
                        >
                          Prénom
                        </Label>
                        <Input
                          id="first_name"
                          value={formData.first_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              first_name: e.target.value,
                            })
                          }
                          placeholder="Jean"
                          className="mt-1 bg-input-background"
                        />
                        {errors.first_name && (
                          <p className="text-destructive mt-1">
                            {errors.first_name}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label
                          htmlFor="last_name"
                          className="required"
                        >
                          Nom de famille
                        </Label>
                        <Input
                          id="last_name"
                          value={formData.last_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              last_name: e.target.value,
                            })
                          }
                          placeholder="Dupont"
                          className="mt-1 bg-input-background"
                        />
                        {errors.last_name && (
                          <p className="text-destructive mt-1">
                            {errors.last_name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Email (lecture seule) et téléphone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <div className="relative mt-1">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            value={user.email || ""}
                            className="pl-10 bg-muted"
                            disabled
                          />
                        </div>
                        <p className="text-muted-foreground mt-1">
                          L'email ne peut pas être modifié
                        </p>
                      </div>

                      <div>
                        <PhoneInput
                          value={{
                            countryCode:
                              formData.phoneCountryCode ||
                              "+261",
                            phoneNumber:
                              formData.phoneNumber || "",
                          }}
                          onChange={({
                            countryCode,
                            phoneNumber,
                          }) =>
                            setFormData({
                              ...formData,
                              phoneCountryCode: countryCode,
                              phoneNumber: phoneNumber,
                              phone:
                                `${countryCode} ${phoneNumber}`.trim(),
                            })
                          }
                          error={errors.phone}
                          required
                          autoDetectCountry={false}
                        />
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bio: e.target.value,
                          })
                        }
                        placeholder="Parlez-nous de vous, vos passions de voyage..."
                        rows={4}
                        className="mt-1 bg-input-background"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interests" className="space-y-6">
            {/* Centres d'intérêt */}
            <InterestSelectorSQL showTitle={false} />
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            {/* Statistiques utilisateur */}
            <Card>
              <CardHeader>
                <CardTitle>Statistiques</CardTitle>
                <CardDescription>
                  Votre activité sur GasyWay
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <div className="text-primary">
                      {user?.interests?.length || 0}
                    </div>
                    <p className="text-secondary-foreground">
                      Centres d'intérêt
                    </p>
                  </div>
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <div className="text-primary">0</div>
                    <p className="text-secondary-foreground">
                      Réservations
                    </p>
                  </div>
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <div className="text-primary">0</div>
                    <p className="text-secondary-foreground">
                      Avis publiés
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bouton de sauvegarde - toujours visible */}
          <div className="flex justify-end"></div>
        </Tabs>
      </form>
    </div>
  );
}