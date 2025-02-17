import { Component, OnInit } from '@angular/core';
import Chart from 'chart.js/auto';
import { AdminService } from '../../services/admin.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-home',
  templateUrl: './admin-home.component.html',
  styleUrls: ['./admin-home.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class AdminHomeComponent implements OnInit {
  totalUsers!: number;
  averageScore!: number;

  constructor(private adminService: AdminService) { }

  ngOnInit() {
    this.loadAnalytics();
    this.renderMatrix();
  }

  loadAnalytics() {
    this.adminService.getDashboardStats().subscribe(data => {
      this.totalUsers = data.totalUsers;
      this.averageScore = data.averageScore;
    });
  }

  renderMatrix() {
    this.adminService.getTrainingNeedsMatrix().subscribe(data => {
      const labels = data.map((item: any) => item.chapterName);
      const scores = data.map((item: any) => item.avgScore);
      const ratings = data.map((item: any) => item.avgRating);

      new Chart('trainingMatrix', {
        type: 'scatter',
        data: {
          labels,
          datasets: [{
            label: 'Chapters',
            data: labels.map((_, i) => ({ x: ratings[i], y: scores[i] })),
            backgroundColor: context => {
              const ctx = context.chart.ctx;
              const gradient = ctx.createLinearGradient(0, 0, 0, 400);
              gradient.addColorStop(0, 'rgba(0, 180, 216, 0.8)');
              gradient.addColorStop(1, 'rgba(0, 118, 182, 0.8)');
              return gradient;
            },
            borderColor: 'rgba(255, 255, 255, 0.8)',
            borderWidth: 2,
            pointRadius: 10, 
            pointHoverRadius: 14, 
            hoverBorderWidth: 3,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false, 
          layout: {
            padding: 20
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Average Rating',
                color: '#4a5568',
                font: {
                  weight: 'bold',
                  size: 14 
                }
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.05)',
                lineWidth: 2
              },
              ticks: {
                font: {
                  size: 12
                }
              }
            },
            y: {
              title: {
                display: true,
                text: 'Average Score',
                color: '#4a5568',
                font: {
                  weight: 'bold',
                  size: 14 
                }
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.05)',
                lineWidth: 2
              },
              ticks: {
                font: {
                  size: 12
                }
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Chapter Performance Distribution',
              font: {
                size: 18,
                weight: 'bold'
              },
              padding: 20
            },
            tooltip: {
              backgroundColor: 'rgba(30, 60, 114, 0.95)',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              padding: 12,
              cornerRadius: 8,
              titleFont: {
                size: 14
              },
              bodyFont: {
                size: 12
              }
            },
            legend: {
              labels: {
                font: {
                  size: 12
                }
              }
            }
          },
          animation: {
            duration: 1000,
            easing: 'easeOutQuart'
          }
        }
      });
    });
  }
}
