import { useState } from 'react';
import { createProfile, deleteProfile, listProfiles, setActiveProfile, type Profile } from '../lib/storage';
import './ProfileScreen.css';

export interface ProfileScreenProps {
  onSelect: (profile: Profile) => void;
}

export function ProfileScreen({ onSelect }: ProfileScreenProps) {
  const [profiles, setProfiles] = useState<Profile[]>(() => listProfiles());
  const [name, setName] = useState('');

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const profile = createProfile(trimmed);
    setName('');
    onSelect(profile);
  };

  const handleSelect = (profile: Profile) => {
    setActiveProfile(profile.id);
    onSelect(profile);
  };

  const handleDelete = (profile: Profile) => {
    const confirmed = window.confirm(`「${profile.name}」を削除しますか？記録もすべて消えます。`);
    if (!confirmed) return;
    deleteProfile(profile.id);
    setProfiles(listProfiles());
  };

  return (
    <div className="profile-screen">
      <h1>だれがつかう？</h1>

      {profiles.length === 0 ? (
        <p className="profile-empty-hint">なまえを入力してプロフィールをつくってね</p>
      ) : (
        <ul className="profile-list">
          {profiles.map((profile) => (
            <li key={profile.id} className="profile-item">
              <button type="button" className="profile-select-button" onClick={() => handleSelect(profile)}>
                {profile.name}
              </button>
              <button
                type="button"
                className="profile-delete-button"
                onClick={() => handleDelete(profile)}
                aria-label={`${profile.name}を削除`}
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="profile-create">
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="なまえを入力"
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleCreate();
          }}
        />
        <button type="button" className="primary-button" onClick={handleCreate} disabled={!name.trim()}>
          つくる
        </button>
      </div>
    </div>
  );
}
