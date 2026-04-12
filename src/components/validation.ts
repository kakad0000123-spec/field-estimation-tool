import { ComponentData, ComponentType } from '../data/types';

export function getComponentWarnings(comp: ComponentData): string[] {
  const warnings: string[] = [];

  // Helper to check if user has started filling (at least one non-zero dimension)
  function hasAnyData(fields: number[]): boolean {
    return fields.some((f) => f !== 0);
  }

  // Check for abnormally large dimensions
  function checkLargeDimension(value: number, fieldName: string) {
    if (value > 10000) {
      warnings.push(`${fieldName} 數值異常大，是否誤用 mm？`);
    }
  }

  // Check quantity
  function checkQuantity(qty: number) {
    if (qty > 100) {
      warnings.push('數量異常大');
    }
  }

  // Check spacing
  function checkSpacing(value: number, fieldName: string) {
    if (value > 0 && (value < 5 || value > 40)) {
      warnings.push(`${fieldName} 間距通常 5~40cm`);
    }
  }

  switch (comp.type) {
    case 'column': {
      const dims = [comp.width, comp.depth, comp.height];
      const started = hasAnyData(dims);
      if (started) {
        if (comp.width === 0) warnings.push('柱寬 尚未填寫');
        if (comp.depth === 0) warnings.push('柱深 尚未填寫');
        if (comp.height === 0) warnings.push('柱高 尚未填寫');
      }
      if (comp.width > 0 && (comp.width < 20 || comp.width > 100)) warnings.push('柱寬通常 20~100cm');
      if (comp.depth > 0 && (comp.depth < 20 || comp.depth > 100)) warnings.push('柱深通常 20~100cm');
      if (comp.height > 0 && (comp.height < 100 || comp.height > 2000)) warnings.push('柱高通常 1~20m');
      checkSpacing(comp.tieSpacing, '箍筋');
      checkQuantity(comp.quantity);
      dims.forEach((d) => checkLargeDimension(d, '尺寸'));
      break;
    }
    case 'beam': {
      const dims = [comp.width, comp.depth, comp.span];
      const started = hasAnyData(dims);
      if (started) {
        if (comp.width === 0) warnings.push('梁寬 尚未填寫');
        if (comp.depth === 0) warnings.push('梁深 尚未填寫');
        if (comp.span === 0) warnings.push('梁跨距 尚未填寫');
      }
      if (comp.width > 0 && (comp.width < 15 || comp.width > 80)) warnings.push('梁寬通常 15~80cm');
      if (comp.depth > 0 && (comp.depth < 20 || comp.depth > 120)) warnings.push('梁深通常 20~120cm');
      if (comp.span > 0 && (comp.span < 100 || comp.span > 2000)) warnings.push('梁跨距通常 1~20m');
      checkSpacing(comp.denseSpacing, '密箍');
      checkSpacing(comp.sparseSpacing, '疏箍');
      checkQuantity(comp.quantity);
      dims.forEach((d) => checkLargeDimension(d, '尺寸'));
      break;
    }
    case 'slab': {
      const dims = [comp.length, comp.width, comp.thickness];
      const started = hasAnyData(dims);
      if (started) {
        if (comp.length === 0) warnings.push('長度 尚未填寫');
        if (comp.width === 0) warnings.push('寬度 尚未填寫');
        if (comp.thickness === 0) warnings.push('厚度 尚未填寫');
      }
      if (comp.thickness > 0 && (comp.thickness < 8 || comp.thickness > 30)) warnings.push('板厚通常 8~30cm');
      if (comp.reinfType === 'rebar') {
        checkSpacing(comp.upperSpacing, '上層筋');
        checkSpacing(comp.lowerSpacing, '下層筋');
      }
      checkQuantity(comp.quantity);
      dims.forEach((d) => checkLargeDimension(d, '尺寸'));
      break;
    }
    case 'wall': {
      const dims = [comp.wallLength, comp.wallHeight, comp.thickness];
      const started = hasAnyData(dims);
      if (started) {
        if (comp.wallLength === 0) warnings.push('牆長 尚未填寫');
        if (comp.wallHeight === 0) warnings.push('牆高 尚未填寫');
        if (comp.thickness === 0) warnings.push('牆厚 尚未填寫');
      }
      if (comp.thickness > 0 && (comp.thickness < 10 || comp.thickness > 40)) warnings.push('牆厚通常 10~40cm');
      checkSpacing(comp.vertSpacing, '直筋');
      checkSpacing(comp.horizSpacing, '橫筋');
      checkQuantity(comp.quantity);
      dims.forEach((d) => checkLargeDimension(d, '尺寸'));
      break;
    }
    case 'floor': {
      const dims = [comp.length, comp.width, comp.thickness];
      const started = hasAnyData(dims);
      if (started) {
        if (comp.length === 0) warnings.push('長度 尚未填寫');
        if (comp.width === 0) warnings.push('寬度 尚未填寫');
        if (comp.thickness === 0) warnings.push('厚度 尚未填寫');
      }
      if (comp.thickness > 0 && (comp.thickness < 8 || comp.thickness > 30)) warnings.push('地坪厚度通常 8~30cm');
      if (comp.reinfType === 'rebar') {
        checkSpacing(comp.upperSpacing, '上層筋');
        checkSpacing(comp.lowerSpacing, '下層筋');
      }
      checkQuantity(comp.quantity);
      dims.forEach((d) => checkLargeDimension(d, '尺寸'));
      break;
    }
    case 'foundation': {
      const dims = [comp.foundLength, comp.foundWidth, comp.foundDepth];
      const started = hasAnyData(dims);
      if (started) {
        if (comp.foundLength === 0) warnings.push('長度 尚未填寫');
        if (comp.foundWidth === 0) warnings.push('寬度 尚未填寫');
        if (comp.foundDepth === 0) warnings.push('深度 尚未填寫');
      }
      checkSpacing(comp.barSpacing, '底筋');
      checkQuantity(comp.quantity);
      dims.forEach((d) => checkLargeDimension(d, '尺寸'));
      break;
    }
    case 'equipFound': {
      const dims = [comp.length, comp.width, comp.depth];
      const started = hasAnyData(dims);
      if (started) {
        if (comp.length === 0) warnings.push('長度 尚未填寫');
        if (comp.width === 0) warnings.push('寬度 尚未填寫');
        if (comp.depth === 0) warnings.push('深度 尚未填寫');
      }
      checkQuantity(comp.quantity);
      dims.forEach((d) => checkLargeDimension(d, '尺寸'));
      break;
    }
    case 'stair': {
      const dims = [comp.stairWidth, comp.steps, comp.riser, comp.tread, comp.slabThick];
      const started = hasAnyData(dims);
      if (started) {
        if (comp.stairWidth === 0) warnings.push('梯寬 尚未填寫');
        if (comp.steps === 0) warnings.push('階數 尚未填寫');
        if (comp.slabThick === 0) warnings.push('板厚 尚未填寫');
      }
      checkSpacing(comp.barSpacing, '主筋');
      checkQuantity(comp.quantity);
      dims.forEach((d) => checkLargeDimension(d, '尺寸'));
      break;
    }
    case 'opening': {
      const dims = [comp.openWidth, comp.openHeight, comp.thickness];
      const started = hasAnyData(dims);
      if (started) {
        if (comp.openWidth === 0) warnings.push('開口寬 尚未填寫');
        if (comp.openHeight === 0) warnings.push('開口高 尚未填寫');
        if (comp.thickness === 0) warnings.push('厚度 尚未填寫');
      }
      checkSpacing(comp.originalSpacing, '原筋');
      checkQuantity(comp.quantity);
      dims.forEach((d) => checkLargeDimension(d, '尺寸'));
      break;
    }
    case 'manualRC':
    case 'custom':
      // No dimension checks for manual/custom
      break;
  }

  return warnings;
}
