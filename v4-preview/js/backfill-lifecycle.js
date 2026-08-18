/* JSI 2026 Optional Extensions V1 - Controlled Compatibility Backfill Script */

(function(window) {
  'use strict';

  var BackfillLifecycle = {
    /**
     * Executes an idempotent backfill adding lifecycleState = "active"
     * to existing Firestore task documents missing the lifecycleState field.
     * Teacher / Admin controlled only.
     */
    runBackfill: async function() {
      if (!window.db) {
        console.warn('Firestore instance not available. Backfill skipped in local mode.');
        return { success: false, message: 'Firestore offline' };
      }

      var userRole = window.AppBridge ? window.AppBridge.getCurrentRole() : 'public';
      if (userRole !== 'teacher') {
        console.error('Backfill authorization failed: Teacher role required.');
        return { success: false, message: 'Teacher authorization required' };
      }

      try {
        var snapshot = await window.db.collection('tasks').get();
        var totalCount = snapshot.size;
        var updatedCount = 0;
        var batch = window.db.batch();

        snapshot.forEach(function(doc) {
          var data = doc.data();
          if (!data.lifecycleState) {
            batch.update(doc.ref, { lifecycleState: 'active' });
            updatedCount++;
          }
        });

        if (updatedCount > 0) {
          await batch.commit();
          console.log('Backfill complete: ' + updatedCount + '/' + totalCount + ' tasks updated with lifecycleState = "active".');
        } else {
          console.log('Backfill clean: All ' + totalCount + ' tasks already possess lifecycleState.');
        }

        return {
          success: true,
          totalCount: totalCount,
          updatedCount: updatedCount,
          timestamp: new Date().toISOString()
        };
      } catch (e) {
        console.error('Backfill error:', e);
        return { success: false, error: e.message };
      }
    }
  };

  window.BackfillLifecycle = BackfillLifecycle;
})(window);
