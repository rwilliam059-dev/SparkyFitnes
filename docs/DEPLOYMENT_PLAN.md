# Préparation du déploiement

## Principes

- Aucun déploiement automatique.
- Aucun secret dans GitHub.
- Sauvegarde avant mise à jour.
- Pas de mise à jour automatique des conteneurs.
- Vérification manuelle après chaque changement.
- `main` reste proche du projet amont.

## Cible

SparkyFitness sera installé en Docker Compose sur le serveur dédié quand William sera disponible.

L'installation officielle actuelle repose sur les fichiers fournis dans les releases SparkyFitness.

## Avant mise en ligne

1. Vérifier l'environnement Docker du serveur.
2. Préparer un répertoire dédié.
3. Configurer les variables localement sur le serveur.
4. Démarrer d'abord en accès local.
5. Vérifier frontend, backend et base de données.
6. Tester un compte utilisateur et une séance tapis complète.
7. Ajouter ensuite l'accès HTTPS public.
8. Vérifier une sauvegarde/restauration avant de considérer l'installation comme prête.

## Mise à jour

Toujours suivre l'ordre : notes de version → sauvegarde → mise à jour → vérification → rollback si nécessaire.

## Personnalisation

Les adaptations liées au tapis restent sur `feat/laurence-treadmill` tant qu'elles ne sont pas validées.
