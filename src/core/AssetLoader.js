export class AssetLoader {
    async loadAll(paths) {
        const results = await Promise.all(paths.map(p => fetch(p).then(r => r.json())));
        const map = {};
        paths.forEach((p, i) => {
            const key = p.split('/').pop().replace('.json', '');
            map[key] = results[i];
        });
        return map;
    }
}
