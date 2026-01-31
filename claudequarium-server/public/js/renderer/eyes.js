// Eye Rendering
// Handles drawing entity eyes in various states

/**
 * Draw happy eyes (^ ^) for waving - relative to center
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} size - Entity size
 */
export function drawHappyEyes(ctx, size) {
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  // Left eye - ^ shape
  ctx.beginPath();
  ctx.moveTo(-7, -2);
  ctx.lineTo(-5, -5);
  ctx.lineTo(-3, -2);
  ctx.stroke();

  // Right eye - ^ shape
  ctx.beginPath();
  ctx.moveTo(3, -2);
  ctx.lineTo(5, -5);
  ctx.lineTo(7, -2);
  ctx.stroke();
}

/**
 * Draw entity eyes relative to center (for rotated entities)
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} entity
 * @param {number} size
 */
export function drawEntityEyesRelative(ctx, entity, size) {
  const eyeRadius = 4;
  const pupilRadius = 2;

  // Eye positions based on facing direction (relative to center)
  let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
  let pupilOffsetX = 0, pupilOffsetY = 0;

  switch (entity.direction) {
    case 'up':
      leftEyeX = -4;
      rightEyeX = 4;
      leftEyeY = rightEyeY = -6;
      pupilOffsetY = -1;
      break;
    case 'left':
      leftEyeX = -6;
      rightEyeX = -2;
      leftEyeY = rightEyeY = -3;
      pupilOffsetX = -1;
      break;
    case 'right':
      leftEyeX = 2;
      rightEyeX = 6;
      leftEyeY = rightEyeY = -3;
      pupilOffsetX = 1;
      break;
    case 'down':
    default:
      leftEyeX = -5;
      rightEyeX = 5;
      leftEyeY = rightEyeY = -3;
      pupilOffsetY = 1;
      break;
  }

  // If moving, look toward next waypoint
  if (entity.isMoving && entity.path && entity.path.length > entity.pathIndex) {
    const target = entity.path[entity.pathIndex];
    const dx = target.x - entity.x;
    const dy = target.y - entity.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      pupilOffsetX = (dx / dist) * 1.5;
      pupilOffsetY = (dy / dist) * 1.5;
    }
  }

  // Draw eye whites
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(leftEyeX, leftEyeY, eyeRadius, 0, Math.PI * 2);
  ctx.arc(rightEyeX, rightEyeY, eyeRadius, 0, Math.PI * 2);
  ctx.fill();

  // Draw pupils
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.arc(leftEyeX + pupilOffsetX, leftEyeY + pupilOffsetY, pupilRadius, 0, Math.PI * 2);
  ctx.arc(rightEyeX + pupilOffsetX, rightEyeY + pupilOffsetY, pupilRadius, 0, Math.PI * 2);
  ctx.fill();
}
