import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface DashboardCard {
  title: string;
  value: number;
  description: string;
  change: string;
  direction: 'up' | 'down' | 'none';
  icon: string;
  color: string;
}

interface Interview {
  candidate: string;
  position: string;
  interviewer: string;
  date: string;
  time: string;
  round: string;
  status: 'Assigned' | 'Pending';
  avatar: string;
}

interface Notification {
  message: string;
  time: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent {

  userName = 'Nikesh Mali';
  userRole = 'HR Manager';

  dashboardCards: DashboardCard[] = [
    {
      title: 'Total Candidates',
      value: 128,
      description: 'All registered candidates',
      change: '12%',
      direction: 'up',
      icon: '♟',
      color: 'purple'
    },
    {
      title: 'Interviews Today',
      value: 8,
      description: 'Scheduled for today',
      change: '25%',
      direction: 'up',
      icon: '▦',
      color: 'green'
    },
    {
      title: 'Pending Interviews',
      value: 15,
      description: 'Awaiting scheduling',
      change: '8%',
      direction: 'up',
      icon: '⌛',
      color: 'orange'
    },
    {
      title: 'Completed Interviews',
      value: 86,
      description: 'This month',
      change: '18%',
      direction: 'up',
      icon: '✓',
      color: 'blue'
    },
    {
      title: 'Feedback Pending',
      value: 7,
      description: 'Awaiting interviewer feedback',
      change: '13%',
      direction: 'down',
      icon: '★',
      color: 'red'
    },
    {
      title: 'Selected Candidates',
      value: 32,
      description: 'This month',
      change: '20%',
      direction: 'up',
      icon: '✿',
      color: 'green'
    },
    {
      title: 'Rejected Candidates',
      value: 28,
      description: 'This month',
      change: '5%',
      direction: 'down',
      icon: '×',
      color: 'red'
    },
    {
      title: 'On Hold Candidates',
      value: 12,
      description: 'This month',
      change: '—',
      direction: 'none',
      icon: 'Ⅱ',
      color: 'orange'
    }
  ];

  upcomingInterviews: Interview[] = [
    {
      candidate: 'John Smith',
      position: 'Software Developer',
      interviewer: 'Amit Sharma',
      date: '14 May 2024',
      time: '10:00 AM',
      round: 'Technical Round',
      status: 'Assigned',
      avatar: 'JS'
    },
    {
      candidate: 'Rahul Kumar',
      position: 'QA Engineer',
      interviewer: 'Sneha Patil',
      date: '14 May 2024',
      time: '11:30 AM',
      round: 'Technical Round',
      status: 'Pending',
      avatar: 'RK'
    },
    {
      candidate: 'Priya Singh',
      position: 'UI/UX Designer',
      interviewer: 'Vikram Singh',
      date: '14 May 2024',
      time: '02:00 PM',
      round: 'HR Round',
      status: 'Assigned',
      avatar: 'PS'
    },
    {
      candidate: 'Amit Verma',
      position: 'DevOps Engineer',
      interviewer: 'Amit Sharma',
      date: '15 May 2024',
      time: '10:00 AM',
      round: 'Technical Round',
      status: 'Pending',
      avatar: 'AV'
    },
    {
      candidate: 'Neha Gupta',
      position: 'Business Analyst',
      interviewer: 'Sneha Patil',
      date: '15 May 2024',
      time: '11:30 AM',
      round: 'HR Round',
      status: 'Assigned',
      avatar: 'NG'
    }
  ];

  notifications: Notification[] = [
    {
      message: 'Interview assigned to Amit Sharma for John Smith',
      time: '10:30 AM',
      icon: '▦',
      color: 'purple'
    },
    {
      message: 'Feedback pending for Rahul Kumar (Technical Round)',
      time: '09:15 AM',
      icon: '♧',
      color: 'orange'
    },
    {
      message: 'Priya Singh feedback submitted successfully',
      time: 'Yesterday',
      icon: '✓',
      color: 'green'
    },
    {
      message: 'Interview scheduled for Neha Gupta on 15 May 2024',
      time: 'Yesterday',
      icon: '▦',
      color: 'blue'
    },
    {
      message: 'Amit Verma interview cancelled',
      time: '2 Days Ago',
      icon: '×',
      color: 'red'
    },
    {
      message: 'New candidate Rahul Mehta registered',
      time: '2 Days Ago',
      icon: '♟',
      color: 'purple'
    }
  ];

  interviewOverview = [
    { label: 'Completed', count: 50, percentage: '41.7%', color: 'completed' },
    { label: 'Scheduled', count: 35, percentage: '29.2%', color: 'scheduled' },
    { label: 'Pending', count: 28, percentage: '23.3%', color: 'pending' },
    { label: 'Cancelled', count: 7, percentage: '5.8%', color: 'cancelled' }
  ];

  trendData = [
    { label: '1-7 May', value: 15, x: 35, y: 150 },
    { label: '8-14 May', value: 28, x: 175, y: 105 },
    { label: '15-21 May', value: 35, x: 315, y: 82 },
    { label: '22-28 May', value: 24, x: 455, y: 118 },
    { label: '29-31 May', value: 18, x: 595, y: 137 }
  ];

  selectedPeriod = 'This Month';

  notificationsCount = 6;

  onPeriodChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedPeriod = select.value;
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    console.log('Search:', input.value);
  }

  viewAllInterviews(): void {
    console.log('Navigate to interviews page');
  }

  viewAllNotifications(): void {
    console.log('Navigate to notifications page');
  }

  viewReports(): void {
    console.log('Navigate to reports page');
  }

  logout(): void {
    // Replace this with your authentication service logout later.
    window.location.href = '/';
  }
}