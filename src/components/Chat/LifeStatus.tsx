import type {
  CharacterActivity,
  LifePriority,
  LifeState,
} from '../../utils/lifeEngine'

type LifeStatusProps = {
  lifeState: LifeState
  compact?: boolean
}

function getActivityLabel(
  activity: CharacterActivity,
) {
  switch (activity) {
    case 'sleeping':
      return 'Sleeping'

    case 'studying':
      return 'Studying'

    case 'travelling':
      return 'Travelling'

    case 'training':
      return 'Training'

    case 'working':
      return 'Working'

    case 'exploring':
      return 'Exploring'

    case 'waiting':
      return 'Waiting'

    case 'socialising':
      return 'Socialising'

    case 'investigating':
      return 'Investigating'

    case 'celebrating':
      return 'Celebrating'

    case 'resting':
      return 'Resting'
  }
}

function getActivityIcon(
  activity: CharacterActivity,
) {
  switch (activity) {
    case 'sleeping':
      return '🌙'

    case 'studying':
      return '📚'

    case 'travelling':
      return '🧭'

    case 'training':
      return '⚔️'

    case 'working':
      return '✦'

    case 'exploring':
      return '🗺️'

    case 'waiting':
      return '⌛'

    case 'socialising':
      return '♟️'

    case 'investigating':
      return '🔎'

    case 'celebrating':
      return '✨'

    case 'resting':
      return '☕'
  }
}

function getPriorityLabel(
  priority: LifePriority,
) {
  switch (priority) {
    case 'critical':
      return 'Urgent'

    case 'high':
      return 'Needs Attention'

    case 'normal':
      return 'Story Update'

    case 'low':
      return 'Update'
  }
}

function LifeStatus({
  lifeState,
  compact = false,
}: LifeStatusProps) {
  const activityLabel =
    getActivityLabel(
      lifeState.currentActivity,
    )

  const activityIcon =
    getActivityIcon(
      lifeState.currentActivity,
    )

  if (compact) {
    return (
      <div className="life-status life-status-compact">
        <span className="life-status-activity">
          <span
            className="life-status-icon"
            aria-hidden="true"
          >
            {activityIcon}
          </span>

          {activityLabel}
        </span>

        {lifeState.needsAttention && (
          <span className="life-status-attention">
            Needs attention
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="life-status">
      <div className="life-status-topline">
        <span className="life-status-activity">
          <span
            className="life-status-icon"
            aria-hidden="true"
          >
            {activityIcon}
          </span>

          {activityLabel}
        </span>

        {lifeState.currentEvent && (
          <span
            className={`life-status-priority life-status-priority-${lifeState.currentEvent.priority}`}
          >
            {getPriorityLabel(
              lifeState.currentEvent.priority,
            )}
          </span>
        )}
      </div>

      {lifeState.returnHook && (
        <p className="life-status-hook">
          {lifeState.returnHook}
        </p>
      )}

      {!lifeState.returnHook &&
        lifeState.currentGoal && (
          <p className="life-status-goal">
            Current goal:{' '}
            {lifeState.currentGoal}
          </p>
        )}
    </div>
  )
}

export default LifeStatus