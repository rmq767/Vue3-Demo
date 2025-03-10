import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import * as Leaflet from "leaflet";
import "leaflet.chinatmsproviders";
import { CesiumData } from "@/types/gis";
import * as turf from "@turf/turf";

export const useLeaflet = (id: string, data?: CesiumData[]) => {
  const map = shallowRef<Leaflet.Map | null>(null);
  // 高德图层
  const gaodeNormal = (Leaflet.tileLayer as any).chinaProvider(
    "GaoDe.Normal.Map",
    {
      maxZoom: 18,
      minZoom: 4,
    }
  );
  const gdNormal = Leaflet.layerGroup([gaodeNormal]);
  // 创建空的线条图层
  let polyline = null as Leaflet.Polyline | null;
  let fakeLine = null as Leaflet.Polyline | null;
  let drawType = "start";
  let startPoint = null as Leaflet.LatLng | null;
  // 线上的点
  const nearestArr = shallowRef<CesiumData[]>([]);
  const nearestMarker = shallowRef<Leaflet.CircleMarker<any>[]>([]);
  const nearestCricle = shallowRef<Leaflet.CircleMarker<any>[]>([]);
  const lineLength = ref(0);

  /**
   * @description 初始化地图
   */
  const initMap = () => {
    // 地图范围限制
    const corner1 = Leaflet.latLng(-90, -180); //设置左上角经纬度
    const corner2 = Leaflet.latLng(90, 180); //设置右下点经纬度
    const bounds = Leaflet.latLngBounds(corner1, corner2); //构建视图限制范
    const render = Leaflet.canvas();
    map.value = new Leaflet.Map(id, {
      maxZoom: 18,
      minZoom: 4,
      // center: coordTransform([104.04504, 30.540729]),
      zoom: 14,
      attributionControl: false, //去掉右下角logo
      layers: [gdNormal],
      maxBounds: bounds,
      renderer: render,
      crs: Leaflet.CRS.EPSG3857,
      zoomControl: false,
    });
  };

  /**
   * @description 绘制点
   */
  const drawPoint = () => {
    if (data?.length) {
      const points = [] as any[];
      data.forEach((item) => {
        // 获取所有点坐标
        points.push({
          lng: item.pointData[0].lon,
          lat: item.pointData[0].lat,
        });
        // 添加点
        Leaflet.circleMarker(
          {
            lat: item.pointData[0].lat,
            lng: item.pointData[0].lon,
          },
          {
            stroke: true,
            color: "#fff",
            fillColor: "red",
            fill: true,
            fillOpacity: 1,
            radius: 10,
          }
        )
          .bindTooltip(item.name, {
            permanent: true, // 使Tooltip始终可见
            direction: "top", // 自动调整Tooltip的显示方向
            className: "my-custom-tooltip", // 自定义CSS类名以应用自定义样式
          })
          .addTo(map.value!);
      });
      if (data.length === 1) {
        const p = data[0].pointData[0];
        polyline = Leaflet.polyline(
          [
            [p.lat - 0.003, p.lon - 0.01],
            [p.lat - 0.003, p.lon + 0.01],
          ],
          {
            color: "red",
          }
        ).addTo(map.value!);
        points.push(polyline.getLatLngs());
        getNearestPointOnLine();
        drawLongLine();
        console.log(nearestArr.value);
      }
      // 将所有点坐标展示到视图中
      // 创建边界对象并扩展以包含所有点
      const bounds = Leaflet.latLngBounds(points);
      // 调整地图视图以包含所有点
      map.value?.fitBounds(bounds, {
        padding: [10, 10],
      });
      // if (data.length > 1) {
      //   // 画一条水平线
      //   const nw = bounds.getNorthWest();
      //   const sw = bounds.getSouthWest();
      //   const ne = bounds.getNorthEast();
      //   const se = bounds.getSouthEast();
      //   polyline = Leaflet.polyline(
      //     [
      //       [(nw.lat + sw.lat) / 2, nw.lng - map.value!.getZoom() * 0.1],
      //       [(ne.lat + se.lat) / 2, ne.lng + map.value!.getZoom() * 0.1],
      //     ],
      //     {
      //       color: "red",
      //     }
      //   ).addTo(map.value!);
      // }
      // getNearestPointOnLine();
    }
  };

  /**
   * @description 初始化鼠标事件进行画线
   */
  const drawLine = () => {
    // 监听点击事件
    map.value?.on("click", drawLineFn);

    // 监听鼠标移动事件
    map.value?.on("mousemove", moveLineFn);
  };
  /**
   * @description 画线
   * @param {Leaflet.LeafletMouseEvent} e
   */
  const drawLineFn = (e: Leaflet.LeafletMouseEvent) => {
    if (drawType === "start") {
      if (polyline) {
        // 重新画线清楚之前的线和标记点
        nearestMarker.value.forEach((item) => {
          item.remove();
        });
        nearestCricle.value.forEach((item) => {
          item.remove();
        });
        polyline.remove();
        fakeLine?.remove();
      }
      // 如果还没有开始绘制，则设置起点并开始绘制
      const startLatLng = e.latlng;
      startPoint = startLatLng;
      polyline = Leaflet.polyline([startLatLng, startLatLng], {
        color: "red",
        weight: 3,
        dashArray: "5,5",
      }).addTo(map.value!); // 使用虚线表示正在绘制
      drawType = "drawing";
    } else if (drawType === "drawing") {
      // 如果已经开始绘制，则设置终点并完成绘制
      const endLatLng = e.latlng;
      polyline?.setLatLngs([startPoint!, endLatLng]); // 添加终点到线条
      polyline?.setStyle({ dashArray: undefined }); // 完成绘制后移除虚线样式
      drawType = "start";
    }
  };
  const moveLineFn = (e: Leaflet.LeafletMouseEvent) => {
    if (drawType === "drawing" && startPoint) {
      polyline?.setLatLngs([startPoint, e.latlng]); // 更新线条的坐标
    }
  };
  const removeLinsener = () => {
    map.value?.off("click", drawLineFn);
    map.value?.off("mousemove", moveLineFn);
  };

  /**
   * @description 销毁地图移除事件
   */
  const destroyMap = () => {
    if (map.value) {
      map.value.remove();
    }
  };

  /**
   * @description 获取点在线上的最近点
   */
  const getNearestPointOnLine = () => {
    if (polyline) {
      nearestArr.value = [];
      // 获取线段点
      const lineArr = polyline
        .getLatLngs()
        .map((item: any) => [item.lng, item.lat]);
      const lineString = turf.lineString(lineArr);
      // 计算每个点距离线段的最近点
      data?.forEach((item, index) => {
        const p = findPerpendicularFoot(
          [item.pointData[0].lon, item.pointData[0].lat],
          lineString.geometry.coordinates[0],
          lineString.geometry.coordinates[1]
        );
        if (p) {
          nearestArr.value.push({
            point: p,
            ...item,
          });
        }
      });
      if (nearestArr.value.length === 1) {
        // // 单个直接赋值
        // const distance = distanceAlongLine(
        //   lineString,
        //   nearestArr.value[0].point
        // );
        // Reflect.set(nearestArr.value[0], "distance", distance);
      } else {
        // 多个排序 按距离排序
        nearestArr.value.sort((a, b) => {
          const distA = distanceAlongLine(lineString, a.point);
          Reflect.set(a, "distance", distA);
          const distB = distanceAlongLine(lineString, b.point);
          Reflect.set(b, "distance", distB);
          return distA - distB;
        });
      }

      // 画出点
      nearestArr.value.forEach((item, index) => {
        // 添加点
        nearestMarker.value[index] = Leaflet.circleMarker(
          [item.point![1], item.point![0]],
          {
            stroke: true,
            color: "#fff",
            fillColor: "green",
            fill: true,
            fillOpacity: 1,
            radius: 5,
          }
        )
          .bindTooltip(`${index + 1}`, {
            permanent: true, // 使Tooltip始终可见
            direction: "top", // 自动调整Tooltip的显示方向
          })
          .addTo(map.value!);
      });
    }
  };

  /**
   * @description 计算点到线起点的距离
   * @param {*} line
   * @param {*} point
   * @return {*}
   */
  function distanceAlongLine(line: any, point: any) {
    const start = line.geometry.coordinates[0];
    const p = turf.point(point);
    const distance = turf.distance(start, p, { units: "kilometres" });
    return distance;
  }

  /**
   * @description 画延长线
   */
  function drawLongLine() {
    const [start, end] = polyline?.getLatLngs() as Leaflet.LatLng[];
    fakeLine = Leaflet.polyline([], {
      color: "green",
      weight: 1,
      dashArray: [10, 10],
    }).addTo(map.value!);
    nearestArr.value.forEach((item) => {
      const well = item.info;
      well.forEach((pp) => {
        const projectedPoint = projectPointToLine(
          pp.coordinate,
          [start.lng, start.lat],
          [end.lng, end.lat]
        );
        const circle = Leaflet.circleMarker(
          [projectedPoint[1], projectedPoint[0]],
          {
            stroke: true,
            color: "#fff",
            fillColor: "green",
            fill: true,
            fillOpacity: 1,
            radius: 5,
          }
        )
          .bindTooltip(pp.type, {
            permanent: true, // 使Tooltip始终可见
            direction: "top", // 自动调整Tooltip的显示方向
          })
          .addTo(map.value!);
        nearestCricle.value.push(circle);
        fakeLine?.addLatLng([projectedPoint[1], projectedPoint[0]]);
      });
    });
    lineLength.value = turf.length(fakeLine.toGeoJSON(), {
      units: "kilometres",
    });
    if (fakeLine.getLatLngs().length) {
      const distanceArr = [] as number[];
      nearestArr.value.forEach((item) => {
        // 已知一条多个点的直线，在直线外定一个点，这个点到线起点为视角方向，求这个视角从左往右的直线上点的顺序
        const lineArr = fakeLine!
          .getLatLngs()
          .map((item: any) => [item.lng, item.lat]);
        const lineString = turf.lineString(lineArr);
        const point = turf.point([
          item.pointData[0].lon,
          item.pointData[0].lat,
        ]);
        // 根据视角方向排序
        const sortArr = sortPointsByViewDirection(lineString, point);
        //起点
        const start = turf.point(sortArr[0].geometry.coordinates);
        item.info.forEach((pp, index) => {
          const linePoint = fakeLine?.getLatLngs()[index] as Leaflet.LatLng;
          const end = turf.point([linePoint.lng, linePoint.lat]);
          const distance = turf.distance(start, end, { units: "kilometres" });
          Reflect.set(pp, "distance", distance);
          distanceArr.push(distance);
        });
      });
      lineLength.value = Math.max(...distanceArr);
    }
  }

  onMounted(() => {
    initMap();
    drawPoint();
  });

  onBeforeUnmount(() => {
    destroyMap();
  });

  return {
    map,
    drawLine,
    nearestPoints: nearestArr,
    getNearestPointOnLine,
    removeLinsener,
    lineLength,
    drawLongLine,
  };
};

// 向量点积
function dotProduct(v1: number[], v2: number[]) {
  return v1[0] * v2[0] + v1[1] * v2[1];
}

// 点到直线的投影（返回投影点的坐标）
function projectPointOntoLine(
  point: number[],
  lineStart: number[],
  lineEnd: number[]
) {
  const lineVec = [lineEnd[0] - lineStart[0], lineEnd[1] - lineStart[1]];
  const pointVec = [point[0] - lineStart[0], point[1] - lineStart[1]];
  const projMag = dotProduct(pointVec, lineVec) / dotProduct(lineVec, lineVec);
  const projVec = [lineVec[0] * projMag, lineVec[1] * projMag];
  return [lineStart[0] + projVec[0], lineStart[1] + projVec[1]];
}

// 检查点是否在线段上（包含端点）
function isPointOnLineSegment(
  point: number[],
  lineStart: number[],
  lineEnd: number[]
) {
  const [x, y] = point;
  const [startX, startY] = lineStart;
  const [endX, endY] = lineEnd;
  return (
    x >= Math.min(startX, endX) &&
    x <= Math.max(startX, endX) &&
    y >= Math.min(startY, endY) &&
    y <= Math.max(startY, endY)
  );
}

// 主函数：找到点到线段的垂点
function findPerpendicularFoot(
  point: number[],
  lineStart: number[],
  lineEnd: number[]
) {
  const projPoint = projectPointOntoLine(point, lineStart, lineEnd);
  if (isPointOnLineSegment(projPoint, lineStart, lineEnd)) {
    return projPoint; // 投影点在线段上，因此它就是垂点
  } else {
    // 投影点不在线段上，但在这个简化的例子中，我们不处理这种情况
    // 在实际应用中，你可能需要决定是返回最近的端点还是返回一个表示“无垂点”的特殊值
    return null; // 或者你可以返回 lineStart 或 lineEnd 中的一个
  }
}

// 计算随机点到直线的垂直投影点
function projectPointToLine(
  pt: number[],
  lineStart: number[],
  lineEnd: number[]
) {
  const A = [lineEnd[0] - lineStart[0], lineEnd[1] - lineStart[1]];
  const B = [pt[0] - lineStart[0], pt[1] - lineStart[1]];
  const dot = A[0] * B[0] + A[1] * B[1];
  const lenSq = A[0] * A[0] + A[1] * A[1];
  const param = dot / lenSq;

  const xx = lineStart[0] + param * A[0];
  const yy = lineStart[1] + param * A[1];

  return [xx, yy];
}

/**
 * @description 根据视角方向对点进行排序
 */
function sortPointsByViewDirection(line: any, externalPoint: any) {
  // 辅助函数：计算两个点之间的向量
  function vector(p1: any, p2: any) {
    return {
      x: p2.geometry.coordinates[0] - p1.geometry.coordinates[0],
      y: p2.geometry.coordinates[1] - p1.geometry.coordinates[1],
    };
  }

  // 辅助函数：计算两个向量的点积
  function dotProduct(v1: any, v2: any) {
    return v1.x * v2.x + v1.y * v2.y;
  }

  // 辅助函数：计算两个向量的叉积
  function crossProduct(v1: any, v2: any) {
    return v1.x * v2.y - v1.y * v2.x;
  }

  // 辅助函数：计算两个向量之间的角度（弧度）
  function angleBetweenVectors(v1: any, v2: any) {
    const dot = dotProduct(v1, v2);
    const mag1 = Math.sqrt(dotProduct(v1, v1));
    const mag2 = Math.sqrt(dotProduct(v2, v2));
    const cosTheta = dot / (mag1 * mag2);
    const angleRad = Math.acos(cosTheta);
    return angleRad;
  }

  // 获取直线起点
  const lineStart = turf.getCoords(line.geometry.coordinates[0]);

  // 计算从起点到外部点的向量
  const startToExternal = vector(
    { geometry: { coordinates: lineStart } },
    externalPoint
  );

  // 计算从起点到每个直线点的向量，并计算角度及叉积
  const pointsWithInfo = line.geometry.coordinates.map((coord: any) => {
    const point = turf.point(coord);
    const startToPoint = vector(
      { geometry: { coordinates: lineStart } },
      point
    );
    const angle = angleBetweenVectors(startToExternal, startToPoint);
    const cross = crossProduct(startToExternal, startToPoint);
    return { point, angle, cross };
  });

  // 根据叉积（方向）和角度进行排序
  pointsWithInfo.sort((a: any, b: any) => {
    if (a.cross !== b.cross) {
      // 确保叉积为正的（逆时针）在前，但由于我们是从左到右看，所以取反使得叉积为负的（顺时针）在前
      // 这取决于你如何定义“左”和“右”，这里假设外部点在直线的左侧时，叉积为负表示正确方向
      return b.cross - a.cross; // 或者 b.cross - a.cross，取决于你的需求
    } else {
      // 角度从小到大排序（这里的角度是弧度，如果需要度数可以转换）
      return a.angle - b.angle;
    }
  });

  // 提取排序后的点并返回
  return pointsWithInfo.map((item: any) => item.point);
}
