import React, { useState } from 'react';
import { InputField, TextareaField, SelectField, FormField } from './form-field';
import { Input } from './input';
import { Card, CardHeader, CardTitle, CardContent } from './card';
import { Button } from './button';

export function FormFieldDemo() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    difficulty: '',
    icon: '🦎'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDemo, setShowDemo] = useState(false);

  const emojis = ['🦎', '🐢', '🦆', '🌿', '🌳', '🌺', '🏔️', '🏖️'];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Le nom est obligatoire';
    if (!formData.description) newErrors.description = 'La description est obligatoire';
    if (!formData.icon) newErrors.icon = 'L\'icône est obligatoire';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      alert('Formulaire valide ! Voir la console pour les données.');
      console.log('Données du formulaire:', formData);
    }
  };

  if (!showDemo) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setShowDemo(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
        >
          📝 Voir Démo FormFields
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg mx-auto bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">✨ Démo FormField Components</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowDemo(false)}
              className="h-8 w-8 p-0"
            >
              ✕
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Nouvelle approche standardisée avec espacement de 4px et astérisques automatiques
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Exemple InputField avec champ requis */}
          <InputField
            label="Nom du centre d'intérêt"
            required
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            placeholder="Faune sauvage"
            error={errors.name}
          />

          {/* Exemple TextareaField */}
          <TextareaField
            label="Description détaillée"
            required
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            placeholder="Décrivez ce centre d'intérêt en détail..."
            rows={3}
            error={errors.description}
          />

          {/* Exemple SelectField */}
          <SelectField
            label="Niveau de difficulté"
            value={formData.difficulty}
            onChange={(value) => setFormData({ ...formData, difficulty: value })}
            placeholder="Choisir une difficulté"
            options={[
              { value: 'easy', label: '🟢 Facile' },
              { value: 'medium', label: '🟡 Modéré' },
              { value: 'hard', label: '🔴 Difficile' }
            ]}
            error={errors.difficulty}
          />

          {/* Exemple FormField personnalisé avec sélecteur d'emoji */}
          <FormField
            label="Icône représentative"
            required
            error={errors.icon}
          >
            <Input
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="🦎"
            />
            <div className="grid grid-cols-8 gap-1 mt-2">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: emoji })}
                  className={`p-2 text-lg rounded border hover:bg-gray-50 transition-colors ${
                    formData.icon === emoji ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </FormField>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setFormData({ name: '', description: '', difficulty: '', icon: '🦎' })}>
              Réinitialiser
            </Button>
            <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
              Valider formulaire
            </Button>
          </div>

          {/* Aperçu des données */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">💾 Aperçu en temps réel :</h4>
            <pre className="text-xs text-gray-600 overflow-auto max-h-32">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}